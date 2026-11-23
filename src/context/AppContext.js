
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { seedEvents } from '../data/mock';
import { supabase } from '../../lib/supabase';

const AppContext = createContext(null);

// Converte o "when" do evento (DD/MM/YYYY, HH:mm) num Date
export function getEventDate(event) {
  const value = event?.when || event?.date;
  if (!value) return null;

  const match = String(value).match(
    /^(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})$/
  );

  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// true se a data do evento já passou
export function eventHasEnded(event) {
  const date = getEventDate(event);
  if (!date) return !!event?.past;
  return date < new Date();
}

function avatarPublicUrl(avatarPath) {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
  return data?.publicUrl || null;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState(seedEvents);
  const [participants, setParticipants] = useState({});
  const [goingIds, setGoingIds] = useState([]);
  const [hostedIds, setHostedIds] = useState([]);
  const [reviews, setReviews] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState({});

  const isSigningUp = useRef(false);

  // ---------------- AUTHENTICATION ----------------

  // Converter os dados do Supabase para o formato usado pela app
  const mapUser = (authUser, profile = null) => {
    if (!authUser) return null;

    return {
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || 'New User',
      email: authUser.email,
      bio: profile?.bio || 'New to 2Gether!',
      interests: profile?.interests || [],
      avatarPath: profile?.avatar_path || null,
      avatarUrl: avatarPublicUrl(profile?.avatar_path),
      since: new Date(
        profile?.created_at || authUser.created_at
      ).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
    };
  };

  const mapNotification = (notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.created_at,
    conversationId: notification.conversation_id,
    eventId: notification.event_id,
    messageCount: notification.message_count || 1,
  });

  // Carregar o perfil da tabela profiles
  const loadProfile = async (authUser) => {
    if (!authUser) return null;

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('name, bio, interests, created_at, avatar_path')
      .eq('id', authUser.id)
      .maybeSingle();

    // Fallback if avatar_path column is not in the DB yet
    if (error && /avatar_path/i.test(error.message || '')) {
      ({ data: profile, error } = await supabase
        .from('profiles')
        .select('name, bio, interests, created_at')
        .eq('id', authUser.id)
        .maybeSingle());
    }

    if (error) {
      console.error('Error loading profile:', error.message);

      const fallbackUser = mapUser(authUser);
      setUser(fallbackUser);
      return fallbackUser;
    }

    const mappedUser = mapUser(authUser, profile);

    setUser(mappedUser);

    return mappedUser;
  };

  // Verificar se já existe uma sessão iniciada
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Error getting session:', error.message);
        setUser(null);
      } else if (data.session?.user) {
        await loadProfile(data.session.user);
      } else {
        setUser(null);
      }

      if (mounted) {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // Detetar alterações na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isSigningUp.current) return;

      // Quando a sessão termina, limpar o utilizador
      if (!session) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carregar eventos do Supabase
  useEffect(() => {
    let mounted = true;

    const loadEvents = async () => {
      if (!user) {
        setEvents(seedEvents);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events:', error.message);
        return;
      }

      if (mounted) {
        // Only real Supabase events when logged in — seed IDs (e1, e2…) are not UUIDs
        setEvents(data ?? []);
      }
    };

    loadEvents();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Carregar eventos organizados pelo utilizador
  useEffect(() => {
    let mounted = true;

    const loadHostedEvents = async () => {
      if (!user) {
        setHostedIds([]);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('host_id', user.id);

      if (error) {
        console.error('Error loading hosted events:', error.message);
        return;
      }

      if (mounted) {
        setHostedIds(data.map((event) => event.id));
      }
    };

    loadHostedEvents();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Carregar participações do utilizador
  useEffect(() => {
    let mounted = true;

    const loadGoingEvents = async () => {
      if (!user) {
        setGoingIds([]);
        return;
      }

      const { data, error } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading participations:', error.message);
        return;
      }

      if (mounted) {
        setGoingIds(data.map((participation) => participation.event_id));
      }
    };

    loadGoingEvents();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const loadParticipants = async () => {
      if (!user) {
        setParticipants({});
        return;
      }

      const { data, error } = await supabase
        .from('event_participants')
        .select('event_id, user_id');

      if (error) {
        console.error('Error loading participants:', error.message);
        return;
      }

      const grouped = {};

      data.forEach((participant) => {
        if (!grouped[participant.event_id]) {
          grouped[participant.event_id] = [];
        }

        grouped[participant.event_id].push(participant.user_id);
      });

      if (mounted) {
        setParticipants(grouped);
      }
    };

    if (!user) {
      setParticipants({});
      return;
    }

    // Subscrever alterações em tempo real
    const channel = supabase
      .channel('event-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
        },
        (payload) => {
          console.log('Participant change:', payload.eventType);
          loadParticipants();
        }
      )
      .subscribe((status) => {
        console.log('Participants realtime:', status);
      });

    // Carregar participantes inicialmente
    loadParticipants();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Carregar reviews do Supabase
  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      if (!user) {
        setReviews({});
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error.message);
        return;
      }

      if (!data || data.length === 0) {
        if (mounted) setReviews({});
        return;
      }

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const eventIds = [...new Set(data.map((r) => r.event_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_path')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const { data: eventData, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      const grouped = {};

      data.forEach((review) => {
        const profile = profiles.find((p) => p.id === review.user_id);
        const event = eventData.find((e) => e.id === review.event_id);

        const imageUrl = review.image_path
          ? supabase.storage
              .from('review-images')
              .getPublicUrl(review.image_path).data.publicUrl
          : null;

        const mappedReview = {
          id: review.id,
          eventId: review.event_id,
          userId: review.user_id,
          content: review.content,
          rating: review.rating,
          accessibilityAccuracy: review.accessibility_accuracy,
          imageUrl,
          author: profile?.name || 'Unknown',
          authorAvatar : avatarPublicUrl(profile?.avatar_path),
          eventTitle: event?.title || 'Event',
          createdAt: review.created_at,
        };

        if (!grouped[review.event_id]) {
          grouped[review.event_id] = [];
        }

        grouped[review.event_id].push(mappedReview);
      });

      if (mounted) {
        setReviews(grouped);
      }
    };

    loadReviews().catch((error) => {
      console.error('Error loading reviews:', error.message);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Carregar notificações do utilizador
  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error.message);
        return;
      }

      if (mounted) {
        setNotifications(data.map(mapNotification));
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Receber e atualizar notificações em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            const updatedNotification = mapNotification(payload.new);

            setNotifications((current) => {
              const exists = current.some(
                (n) => n.id === updatedNotification.id
              );

              if (exists) {
                return current.map((n) =>
                  n.id === updatedNotification.id
                    ? updatedNotification
                    : n
                );
              }

              return [updatedNotification, ...current];
            });
          }

          if (payload.eventType === 'DELETE') {
            setNotifications((current) =>
              current.filter((n) => n.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await loadProfile(data.user);

    return data.user;
  };

  // Registo
  const signUp = async (name, email, password) => {
    isSigningUp.current = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        const { error: logoutError } = await supabase.auth.signOut();

        if (logoutError) throw logoutError;
      }

      return data.user;
    } finally {
      isSigningUp.current = false;
    }
  };

  // Logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
  };

  // Atualizar perfil
  const updateProfile = async (patch) => {
    if (!user) return;

    const updates = {};

    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.bio !== undefined) updates.bio = patch.bio;
    if (patch.interests !== undefined) updates.interests = patch.interests;
    if (patch.avatar_path !== undefined) updates.avatar_path = patch.avatar_path;

    if (Object.keys(updates).length === 0) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('name, bio, interests, created_at, avatar_path')
      .single();

    if (error) throw error;

    setUser((currentUser) => {
      const mapped = mapUser(
        {
          id: currentUser.id,
          email: currentUser.email,
          created_at: currentUser.created_at,
          user_metadata: { name: currentUser.name },
        },
        data
      );

      // Bust cache when the same storage path is reused
      if (mapped.avatarUrl && updates.avatar_path) {
        mapped.avatarUrl = `${mapped.avatarUrl}?t=${Date.now()}`;
      }

      return { ...currentUser, ...mapped };
    });
  };

  // Upload da imagem de perfil
  const uploadAvatar = async (imageUri) => {
    if (!user) {
      throw new Error('You must be logged in to update your photo.');
    }

    if (!imageUri) {
      throw new Error('No image selected.');
    }

    const response = await fetch(imageUri);

    if (!response.ok) {
      throw new Error('Could not read the selected image.');
    }

    const imageBlob = await response.blob();
    const imagePath = `${user.id}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(imagePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    await updateProfile({ avatar_path: imagePath });
  };

  // ---------------- NOTIFICATIONS ----------------

  const pushNotification = async (notification) => {
    if (!user) {
      console.error('ERRO: Não existe utilizador autenticado.');
      return;
    }

    const targetUserId = notification.userId || user.id;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'general',
        read: false,
        event_id: notification.eventId || null,
        conversation_id: notification.conversationId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Notification insert failed:', error.message);
      throw error;
    }

    if (targetUserId === user.id) {
      setNotifications((current) => [
        mapNotification(data),
        ...current,
      ]);
    }

    return data;
  };

  const markAllRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking notifications as read:', error.message);
      throw error;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const markRead = async (id) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = async (id) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error.message);
      throw error;
    }

    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const clearNotifications = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing notifications:', error.message);
      throw error;
    }

    setNotifications([]);
  };

  // ---------------- EVENTS ----------------

  // Contar participantes de um evento
  const countOf = (event) => {
    return participants[event.id]?.length || 0;
  };

  // Calcular lugares disponíveis
  const spotsLeft = (event) => {
    return Math.max(0, event.capacity - countOf(event));
  };

  // Entrar num evento
  const joinEvent = async (eventId) => {
    if (!user) {
      throw new Error('You must be logged in to join an event.');
    }

    if (goingIds.includes(eventId)) return;

    const { error } = await supabase.rpc('join_event', {
      p_event_id: eventId,
    });

    if (error) {
      if (error.message.includes('EVENT_FULL')) {
        throw new Error('This event is full.');
      }

      throw error;
    }

    setGoingIds((current) =>
      current.includes(eventId) ? current : [...current, eventId]
    );

    setParticipants((current) => ({
      ...current,
      [eventId]: [
        ...(current[eventId] || []),
        user.id,
      ],
    }));

    // O organizador é notificado pela base de dados
    // (trigger_notify_host_on_join, ver supabase/notifications.sql).
  };


  // Sair de um evento
  const leaveEvent = async (eventId) => {
    if (!user) {
      throw new Error('You must be logged in to leave an event.');
    }

    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;

    setGoingIds((current) =>
      current.filter((id) => id !== eventId)
    );

    setParticipants((current) => ({
      ...current,
      [eventId]: (current[eventId] || []).filter(
        (id) => id !== user.id
      ),
    }));

    // Quem está na lista de espera é notificado pela base de dados
    // (trigger_notify_waitlist).
  };

  // Criar evento
  const createEvent = async (eventData) => {
    if (!user) {
      throw new Error('You must be logged in to create an event.');
    }

    console.log('1. A criar evento...');

    const { imageUri, ...eventFields } = eventData;

    const newEvent = {
      ...eventFields,
      host: user.name,
      host_id: user.id,
      short: eventFields.when,
      base: 0,
      people: [],
    };

    const { data, error } = await supabase
      .from('events')
      .insert(newEvent)
      .select()
      .single();

    if (error) throw error;

    console.log('2. Evento criado:', data);

    let finalEvent = data;
    let imagePath = null;

    if (imageUri) {
      try {
        const response = await fetch(imageUri);

        if (!response.ok) {
          throw new Error('Could not read the selected image.');
        }

        const imageBlob = await response.blob();

        imagePath = `${user.id}/${data.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(imagePath, imageBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: updatedEvent, error: updateError } = await supabase
          .from('events')
          .update({ image_path: imagePath })
          .eq('id', data.id)
          .select()
          .single();

        if (updateError) throw updateError;

        finalEvent = updatedEvent;

        console.log('3. Fotografia enviada:', imagePath);
      } catch (imageError) {
        console.error('Error uploading event image:', imageError);

        if (imagePath) {
          await supabase.storage
            .from('event-images')
            .remove([imagePath]);
        }

        await supabase
          .from('events')
          .delete()
          .eq('id', data.id)
          .eq('host_id', user.id);

        throw new Error(
          `Event image upload failed: ${imageError.message}`
        );
      }
    }

    setEvents((current) => [finalEvent, ...current]);

    console.log('4. Eventos atualizados');

    setHostedIds((current) => [...current, finalEvent.id]);

    console.log('5. HostedIds atualizado');

    await pushNotification({
      title: 'Event created',
      message: `Your event "${finalEvent.title}" has been created.`,
      type: 'event',
      eventId: finalEvent.id,
    });

    console.log('6. Notificação criada');

    return finalEvent;
  };

  // Update event
  const updateEvent = async (eventId, eventData) => {
    if (!user) throw new Error('You must be logged in.');

    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .eq('host_id', user.id)
      .select()
      .single();

    if (error) throw error;

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? data : event
      )
    );

    return data;
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    if (!user) throw new Error('You must be logged in.');

    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('host_id', user.id)
      .select('id')
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('Event not found or you are not the host.');
    }

    // Atualizar os dados locais
    setEvents((prev) =>
      prev.filter((event) => event.id !== eventId)
    );

    setParticipants((prev) => {
      const updated = { ...prev };
      delete updated[eventId];
      return updated;
    });

    setGoingIds((prev) =>
      prev.filter((id) => id !== eventId)
    );

    setHostedIds((prev) =>
      prev.filter((id) => id !== eventId)
    );

    return data;
  };

  // ---------------- REVIEWS ----------------

  const addReview = async (eventId, review) => {
    if (!user) {
      throw new Error('You must be logged in to publish a review.');
    }

    const content = (review.content || '').trim();
    const rating = Number(review.rating);
    const imageUri = review.imageUri || null;
    // 'yes' | 'partly' | 'no' — só para eventos com tags de acessibilidade
    const accessibilityAccuracy = review.accessibilityAccuracy || null;

    if (!content) {
      throw new Error('Please write your review.');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Please select a rating between 1 and 5.');
    }

    let imagePath = null;

    if (imageUri) {
      imagePath = `${user.id}/${eventId}.jpg`;

      const response = await fetch(imageUri);

      if (!response.ok) {
        throw new Error('Could not read the selected image.');
      }

      const imageBlob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(imagePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        event_id: eventId,
        user_id: user.id,
        content,
        rating,
        image_path: imagePath,
        accessibility_accuracy: accessibilityAccuracy,
      })
      .select()
      .single();

    if (error) {
      if (imagePath) {
        await supabase.storage
          .from('review-images')
          .remove([imagePath]);
      }

      throw error;
    }

    const event = events.find((e) => e.id === eventId);

    const newReview = {
      id: data.id,
      eventId: data.event_id,
      userId: data.user_id,
      content: data.content,
      rating: data.rating,
      accessibilityAccuracy: data.accessibility_accuracy,
      imageUrl: imagePath
        ? supabase.storage
            .from('review-images')
            .getPublicUrl(imagePath).data.publicUrl
        : null,
      author: user.name,
      authorAvatar: user.avatarUrl,
      eventTitle: event?.title || 'Event',
      createdAt: data.created_at,
    };

    setReviews((current) => ({
      ...current,
      [eventId]: [
        newReview,
        ...(current[eventId] || []),
      ],
    }));

    return newReview;
  };

  // ---------------- CHATS ----------------

  // Criar ou recuperar uma conversa associada a um evento
  const getOrCreateConversation = async (eventId) => {
    if (!user) {
      throw new Error('You must be logged in to start a conversation.');
    }

    const event = events.find((e) => e.id === eventId);

    if (!event || !event.host_id) {
      throw new Error('This event is not available for messaging.');
    }

    if (event.host_id === user.id) {
      throw new Error('You cannot message yourself.');
    }

    const { data: existingConversation, error: searchError } =
      await supabase
        .from('conversations')
        .select('*')
        .eq('event_id', eventId)
        .eq('participant_id', user.id)
        .maybeSingle();

    if (searchError) throw searchError;

    if (existingConversation) {
      return existingConversation;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        event_id: eventId,
        host_id: event.host_id,
        participant_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: conversation, error: retryError } =
          await supabase
            .from('conversations')
            .select('*')
            .eq('event_id', eventId)
            .eq('participant_id', user.id)
            .single();

        if (retryError) throw retryError;
        return conversation;
      }

      throw error;
    }

    return data;
  };

  // Carregar todas as conversas de um evento (para o organizador)
  const loadEventConversations = async (eventId) => {
    if (!user) {
      throw new Error('You must be logged in.');
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!conversations || conversations.length === 0) {
      return [];
    }

    const participantIds = [
      ...new Set(conversations.map((c) => c.participant_id)),
    ];

    const conversationIds = conversations.map((c) => c.id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', participantIds);

    if (profilesError) throw profilesError;

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    return conversations.map((conversation) => {
      const participant = profiles.find(
        (p) => p.id === conversation.participant_id
      );

      const conversationMessages = messages.filter(
        (m) => m.conversation_id === conversation.id
      );

      const lastMessage = conversationMessages[0];

      const unreadCount = conversationMessages.filter(
        (m) => m.sender_id !== user.id && m.read_at === null
      ).length;

      return {
        ...conversation,
        participantName: participant?.name || 'Participant',
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageAt: lastMessage?.created_at || conversation.created_at,
        unreadCount,
      };
    });
  };

  // Inbox: todas as conversas em que o utilizador é host ou participante
  const loadUserConversations = async () => {
    if (!user) {
      throw new Error('You must be logged in.');
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`host_id.eq.${user.id},participant_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!conversations || conversations.length === 0) {
      return [];
    }

    const otherUserIds = [
      ...new Set(
        conversations.map((c) =>
          c.host_id === user.id ? c.participant_id : c.host_id
        )
      ),
    ];

    const eventIds = [...new Set(conversations.map((c) => c.event_id))];
    const conversationIds = conversations.map((c) => c.id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_path')
      .in('id', otherUserIds);

    if (profilesError) throw profilesError;

    const { data: eventData, error: eventsError } = await supabase
      .from('events')
      .select('id, title')
      .in('id', eventIds);

    if (eventsError) throw eventsError;

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id, read_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    const enriched = conversations.map((conversation) => {
      const otherId =
        conversation.host_id === user.id
          ? conversation.participant_id
          : conversation.host_id;

      const other = profiles?.find((p) => p.id === otherId);
      const event = eventData?.find((e) => e.id === conversation.event_id);

      const conversationMessages = (messages || []).filter(
        (m) => m.conversation_id === conversation.id
      );

      const lastMessage = conversationMessages[0];

      const unreadCount = conversationMessages.filter(
        (m) => m.sender_id !== user.id && m.read_at === null
      ).length;

      return {
        ...conversation,
        otherName: other?.name || 'User',
        otherAvatarUrl: avatarPublicUrl(other?.avatar_path),
        eventTitle: event?.title || 'Event',
        isHost: conversation.host_id === user.id,
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageAt: lastMessage?.created_at || conversation.created_at,
        unreadCount,
      };
    });

    // Mais recentes primeiro (por última mensagem)
    return enriched.sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error.message);
      throw error;
    }

    const mappedMessages = data.map((message) => ({
      id: message.id,
      text: message.content,
      from: message.sender_id === user.id ? 'me' : 'other',
      time: new Date(message.created_at).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    setChats((current) => ({
      ...current,
      [conversationId]: mappedMessages,
    }));

    return mappedMessages;
  };

  // Marcar como lidas as mensagens recebidas numa conversa
  const markConversationRead = async (conversationId) => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('Error marking messages as read:', error.message);
      throw error;
    }
  };

  // Enviar uma mensagem
  const sendMessage = async (conversationId, message) => {
    if (!user) {
      throw new Error('You must be logged in to send messages.');
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error.message);
      throw error;
    }

    const newMessage = {
      id: data.id,
      text: data.content,
      from: 'me',
      time: new Date(data.created_at).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChats((current) => ({
      ...current,
      [conversationId]: [
        ...(current[conversationId] || []),
        newMessage,
      ],
    }));

    // O destinatário é notificado pela base de dados (trigger on_new_message).

    return data;
  };

  // ---------------- DERIVED DATA ----------------

  const pastEvents = events
    .filter(
      (event) => goingIds.includes(event.id) && eventHasEnded(event)
    )
    .map((event) => ({
      ...event,
      reviewed: (reviews[event.id] || []).some(
        (review) => review.userId === user?.id
      ),
    }));

  const upcomingEvents = events.filter(
    (event) => goingIds.includes(event.id) && !eventHasEnded(event)
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const joinedCount = goingIds.length;

  const hostedEvents = events.filter(
    (e) => e.host_id === user?.id
  );

  const receivedReviews = useMemo(() => {
    const hostedIdSet = new Set(hostedIds);

    return Object.values(reviews || {})
      .flat()
      .filter(
        (review) =>
          hostedIdSet.has(review.eventId) && review.userId !== user?.id
      )
      .sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
  }, [reviews, hostedIds, user?.id]);

  const averageRating = useMemo(() => {
    if (receivedReviews.length === 0) return null;

    const total = receivedReviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );

    return Math.round((total / receivedReviews.length) * 10) / 10;
  }, [receivedReviews]);

  const badges = useMemo(
    () => [
      {
        id: 'first-event',
        name: 'First Event',
        icon: '🎉',
        hint: 'Join 1 event',
        earned: joinedCount >= 1,
      },
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        icon: '🦋',
        hint: 'Join 5 events',
        earned: joinedCount >= 5,
      },
      {
        id: 'host',
        name: 'Host',
        icon: '⭐',
        hint: 'Host 1 event',
        earned: hostedEvents.length >= 1,
      },
    ],
    [joinedCount, hostedEvents.length]
  );

  // ---------------- CONTEXT VALUE ----------------

  const value = {
    user,
    authLoading,
    login,
    signUp,
    logout,
    updateProfile,
    uploadAvatar,

    events,
    setEvents,
    participants,
    goingIds,
    hostedIds,
    reviews,
    notifications,
    chats,

    pushNotification,
    markAllRead,
    markRead,
    deleteNotification,
    clearNotifications,

    countOf,
    spotsLeft,
    joinEvent,
    leaveEvent,
    createEvent,
    updateEvent,
    deleteEvent,

    addReview,
    getOrCreateConversation,
    loadEventConversations,
    loadUserConversations,
    loadMessages,
    markConversationRead,
    sendMessage,

    pastEvents,
    upcomingEvents,
    unreadCount,
    joinedCount,
    hostedEvents,
    badges,
    receivedReviews,
    averageRating,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

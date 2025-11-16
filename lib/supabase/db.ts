/**
 * Supabase database utilities
 */

import { createClient } from './server';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  category: string;
  recipient_email: string;
  recipient_name: string;
  worker_name: string | null;
  worker_email: string | null;
  worker_phone: string | null;
  topic: string;
  message: string;
  timestamp: string;
  status: string;
  created_at: string;
}

export interface CarpoolPost {
  id: number;
  user_id: string;
  type: 'offer' | 'request';
  starting_point: string;
  destination: string;
  date: string;
  time: string;
  price: string | null;
  availability: string | null;
  additional_info: string | null;
  created_at: string;
}

export interface HousingPost {
  id: number;
  user_id: string;
  location: string;
  type: 'shared' | 'private';
  title: string;
  description: string;
  price: string | null;
  contact_info: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  post_id: number;
  post_type: 'carpool' | 'housing';
  message: string;
  created_at: string;
}

export interface ContactExchange {
  id: number;
  user1_id: string;
  user2_id: string;
  post_id: number;
  post_type: 'carpool' | 'housing';
  contact_shared_by: string;
  created_at: string;
}

// User functions
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) return null;
  return data as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) return null;
  return data as User;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (error || !data) return null;
  return data as User;
}

export async function createUser(userData: {
  id: string;
  email: string;
  name: string;
  phone: string;
}): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      phone_verified: false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as User;
}

export async function updateUserPhoneVerified(userId: string, verified: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({ phone_verified: verified })
    .eq('id', userId);
  
  if (error) throw error;
}

// Message functions
export async function createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

// Carpool functions
export async function getCarpoolPosts(): Promise<CarpoolPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('carpool_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as CarpoolPost[];
}

export async function getCarpoolPostById(id: number): Promise<CarpoolPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('carpool_posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data as CarpoolPost;
}

export async function createCarpoolPost(postData: Omit<CarpoolPost, 'id' | 'created_at'>): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('carpool_posts')
    .insert(postData)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

export async function deleteCarpoolPost(id: number, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('carpool_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  return !error;
}

// Housing functions
export async function getHousingPosts(): Promise<HousingPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('housing_posts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as HousingPost[];
}

export async function getHousingPostById(id: number): Promise<HousingPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('housing_posts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) return null;
  return data as HousingPost;
}

export async function createHousingPost(postData: Omit<HousingPost, 'id' | 'created_at'>): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('housing_posts')
    .insert(postData)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

export async function deleteHousingPost(id: number, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('housing_posts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  return !error;
}

// Chat functions
export async function getChatMessages(postId: number, postType: 'carpool' | 'housing'): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('post_id', postId)
    .eq('post_type', postType)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return (data || []) as ChatMessage[];
}

export async function createChatMessage(messageData: Omit<ChatMessage, 'id' | 'created_at'>): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}

// Contact exchange functions
export async function getContactExchange(
  user1Id: string,
  user2Id: string,
  postId: number,
  postType: 'carpool' | 'housing'
): Promise<ContactExchange | null> {
  const supabase = await createClient();
  // Query for either direction of the exchange
  const { data, error } = await supabase
    .from('contact_exchanges')
    .select('*')
    .eq('post_id', postId)
    .eq('post_type', postType)
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .maybeSingle();
  
  if (error || !data) return null;
  return data as ContactExchange;
}

export async function createContactExchange(
  exchangeData: Omit<ContactExchange, 'id' | 'created_at'>
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contact_exchanges')
    .insert(exchangeData)
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for BidDeed.AI tables
export interface PropertyCard {
  id: string;
  case_number: string;
  auction_date: string;
  address: string;
  city: string;
  zip: string;
  photo_url?: string;
  opening_bid: number;
  final_judgment: number;
  max_bid: number;
  ml_score: number;
  decision: 'BID' | 'REVIEW' | 'SKIP';
  arv?: number;
  bid_judgment_ratio: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PipelineRun {
  id: string;
  property_id: string;
  auction_date?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  current_stage?: string;
  progress: number;
  stages: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    duration?: number;
  }>;
  result?: {
    decision: 'BID' | 'REVIEW' | 'SKIP';
    mlScore: number;
    maxBid?: number;
    reportUrl?: string;
  };
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  tool_calls?: Array<{
    name: string;
    input: Record<string, any>;
    output?: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'error';
  }>;
  created_at: string;
}

// Helper functions
export async function getPropertyCards(auctionDate: string) {
  const { data, error } = await supabase
    .from('property_cards')
    .select('*')
    .eq('auction_date', auctionDate)
    .order('ml_score', { ascending: false });
  
  if (error) throw error;
  return data as PropertyCard[];
}

export async function getPipelineRun(runId: string) {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .eq('id', runId)
    .single();
  
  if (error) throw error;
  return data as PipelineRun;
}

export async function saveChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single();
  
  if (error) throw error;
  return data as ChatMessage;
}

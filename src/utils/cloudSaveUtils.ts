import { createClient } from '@supabase/supabase-js';
import { GameState } from '@/types/game';
import { SaveData } from './saveLoadUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CloudSaveData extends SaveData {
  userId: string;
  saveName: string;
  lastPlayed: number;
  playTime: number;
}

export async function saveToCloud(
  userId: string,
  saveData: SaveData,
  saveName: string = 'Main Save'
): Promise<void> {
  try {
    const cloudSaveData: CloudSaveData = {
      ...saveData,
      userId,
      saveName,
      lastPlayed: Date.now(),
      playTime: saveData.gameState.playerData.playTime || 0
    };

    const { error } = await supabase
      .from('game_saves')
      .upsert({
        user_id: userId,
        save_name: saveName,
        save_data: cloudSaveData,
        last_played: new Date().toISOString(),
        play_time: cloudSaveData.playTime
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save to cloud:', error);
    throw error;
  }
}

export async function loadFromCloud(
  userId: string,
  saveName: string = 'Main Save'
): Promise<SaveData | null> {
  try {
    const { data, error } = await supabase
      .from('game_saves')
      .select('save_data')
      .eq('user_id', userId)
      .eq('save_name', saveName)
      .single();

    if (error) throw error;
    if (!data) return null;

    return data.save_data as SaveData;
  } catch (error) {
    console.error('Failed to load from cloud:', error);
    throw error;
  }
}

export async function listCloudSaves(userId: string): Promise<Array<{ name: string; lastPlayed: string; playTime: number }>> {
  try {
    const { data, error } = await supabase
      .from('game_saves')
      .select('save_name, last_played, play_time')
      .eq('user_id', userId)
      .order('last_played', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(save => ({
      name: save.save_name,
      lastPlayed: save.last_played,
      playTime: save.play_time
    }));
  } catch (error) {
    console.error('Failed to list cloud saves:', error);
    throw error;
  }
}

export async function deleteCloudSave(userId: string, saveName: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('game_saves')
      .delete()
      .eq('user_id', userId)
      .eq('save_name', saveName);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete cloud save:', error);
    throw error;
  }
}

export async function syncLocalToCloud(userId: string, localSave: SaveData): Promise<void> {
  try {
    const cloudSave = await loadFromCloud(userId);
    
    if (!cloudSave || cloudSave.timestamp < localSave.timestamp) {
      await saveToCloud(userId, localSave);
    }
  } catch (error) {
    console.error('Failed to sync local save to cloud:', error);
    throw error;
  }
}

export async function syncCloudToLocal(userId: string): Promise<SaveData | null> {
  try {
    const cloudSave = await loadFromCloud(userId);
    if (!cloudSave) return null;

    const localSave = localStorage.getItem('recordingStudioTycoonSave');
    if (!localSave) return cloudSave;

    const localData = JSON.parse(localSave) as SaveData;
    if (cloudSave.timestamp > localData.timestamp) {
      return cloudSave;
    }

    return null;
  } catch (error) {
    console.error('Failed to sync cloud save to local:', error);
    throw error;
  }
} 
export type SettingType = 'forest' | 'school' | 'space' | 'city' | string;
export type ToneType = 'light-hearted' | 'dramatic' | 'poetic' | 'funny' | string;
export type ArtStyleType = 'anime' | 'comic book' | 'pixel art' | 'realistic' | string;

export interface PromptRequest {
  prompt: string;
  character_name: string;
  setting: SettingType;
  tone: ToneType;
  style: ArtStyleType;
}

export interface PanelOutline {
  panel: number;
  title: string;
  scene_description: string;
  image_prompt: string;
}

export interface PanelLayoutItem {
  panel: number;
  title: string;
  image_path: string;
  scene_description: string;
  caption: string;
  narration: string;
  dialogues?: string[];
  image_prompt: string;
  text?: string;
}

export interface ComicStoryResult {
  id: string;
  timestamp: string;
  title: string;
  request: PromptRequest;
  outline: PanelOutline[];
  full_story: string;
  layout: PanelLayoutItem[];
  pdf_path?: string;
}

export interface GenerationStep {
  step: number;
  total: number;
  message: string;
  detail?: string;
}

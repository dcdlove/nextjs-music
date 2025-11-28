export interface Song {
  singer: string;
  title: string;
  ext: string;
  url: string;
  url2?: string;
  null?: boolean;
}

export type SortMode = 'default' | 'random' | 'liked';

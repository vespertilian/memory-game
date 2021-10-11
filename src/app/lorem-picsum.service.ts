import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PicsumPhoto {
  id: string;
  author: string;
  width: number;
  height: number;
  download_url: string;
  url: string;
}

export type PicsumPhotos = PicsumPhoto[];

export const PICSUM_URL = 'https://picsum.photos';

@Injectable({
  providedIn: 'root',
})
export class LoremPicsumService {
  constructor(private readonly http: HttpClient) {}

  getPicsumPhotosList({ limit }: { limit: number }) {
    return this.http.get<PicsumPhotos>(`${PICSUM_URL}/v2/list/limit=${limit}`);
  }
}

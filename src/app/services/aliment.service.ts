import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Aliment {
  id: number;
  name: string;
  category: string;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  image_url: string;
  unit: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlimentService {
  private apiUrl = 'http://localhost:8000/api/nutrition/aliments'; // Adjust if your backend URL is different

  constructor(private http: HttpClient) { }

  getAliments(): Observable<Aliment[]> {
    return this.http.get<Aliment[]>(this.apiUrl);
  }
}

import { Injectable } from "@angular/core";

export interface Book {
  id: number;
  title: string;
  author: string;
  publishedDate: string;
  isRecent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private books: Book[] = [
    { id: 1, title: 'Angular Basics', author: 'John Doe', publishedDate: '2025-01-01', isRecent: true },
    { id: 2, title: 'Spring Boot Guide', author: 'Jane Smith', publishedDate: '2024-09-15', isRecent: false },
    { id: 3, title: 'Microservices Made Easy', author: 'Alex Johnson', publishedDate: '2025-02-12', isRecent: true }
  ];

  getAllBooks(): Book[] {
    return this.books;
  }

  getRecentBooks(): Book[] {
    return this.books.filter(b => b.isRecent);
  }
}

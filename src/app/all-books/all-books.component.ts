import { Component, Input } from '@angular/core';
import { BookCardComponent } from '../book-card/book-card.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Book, BookService } from '../services/book.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-all-books',
  standalone: true, 
  imports: [BookCardComponent,RouterModule,CommonModule,MatCardModule],
  templateUrl: './all-books.component.html',
  styleUrl: './all-books.component.css'
})
export class AllBooksComponent {
  
  allBooks: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.allBooks = this.bookService.getAllBooks();
  }
}

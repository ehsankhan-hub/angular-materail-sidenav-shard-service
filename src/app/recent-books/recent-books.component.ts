import { Component, OnInit } from '@angular/core';
import { Book, BookService } from '../services/book.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { TrainingComponent } from '../pages/training/training.component';

@Component({
  selector: 'app-recent-books',
  standalone: true, 
  imports: [BookCardComponent,MatCardModule,CommonModule,TrainingComponent],
  templateUrl: './recent-books.component.html',
  styleUrl: './recent-books.component.css'
})
export class RecentBooksComponent implements OnInit {
  recentBooks: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.recentBooks = this.bookService.getRecentBooks();
  }
}
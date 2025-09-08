import { Component, Input } from '@angular/core';
import { Book } from '../services/book.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-book-card',
  imports: [MatCardModule],
  standalone: true, 
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css'
})
export class BookCardComponent {
  @Input() book!: Book;   // single book details
}

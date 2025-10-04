import { TestBed } from '@angular/core/testing';

import { ReviewrsService } from './reviewrs.service';

describe('ReviewrsService', () => {
  let service: ReviewrsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReviewrsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

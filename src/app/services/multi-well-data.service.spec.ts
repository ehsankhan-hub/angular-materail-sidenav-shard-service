import { TestBed } from '@angular/core/testing';

import { MultiWellDataService } from './multi-well-data.service';

describe('MultiWellDataService', () => {
  let service: MultiWellDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultiWellDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

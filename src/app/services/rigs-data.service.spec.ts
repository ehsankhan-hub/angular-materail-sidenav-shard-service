import { TestBed } from '@angular/core/testing';

import { RigsDataService } from './rigs-data.service';

describe('RigsDataService', () => {
  let service: RigsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RigsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

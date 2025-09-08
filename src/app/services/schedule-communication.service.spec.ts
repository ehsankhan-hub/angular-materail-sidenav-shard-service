import { TestBed } from '@angular/core/testing';

import { ScheduleCommunicationService } from './schedule-communication.service';

describe('ScheduleCommunicationService', () => {
  let service: ScheduleCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScheduleCommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

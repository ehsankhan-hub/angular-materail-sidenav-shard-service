import { TestBed } from '@angular/core/testing';

import { StaticTemplateSharedService } from './static-template-shared.service';

describe('StaticTemplateSharedService', () => {
  let service: StaticTemplateSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticTemplateSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

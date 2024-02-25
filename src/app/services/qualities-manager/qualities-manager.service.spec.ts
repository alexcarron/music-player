import { TestBed } from '@angular/core/testing';

import { QualitiesManagerService } from './qualities-manager.service';

describe('QualitiesManagerService', () => {
  let service: QualitiesManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QualitiesManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

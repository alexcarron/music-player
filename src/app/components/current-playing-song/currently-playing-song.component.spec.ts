import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentlyPlayingSongComponent } from './currently-playing-song.component';

describe('CurrentlyPlayingSongComponent', () => {
  let component: CurrentlyPlayingSongComponent;
  let fixture: ComponentFixture<CurrentlyPlayingSongComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentlyPlayingSongComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentlyPlayingSongComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

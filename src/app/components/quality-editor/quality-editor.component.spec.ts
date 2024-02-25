import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityEditorComponent } from './quality-editor.component';

describe('QualityEditorComponent', () => {
  let component: QualityEditorComponent;
  let fixture: ComponentFixture<QualityEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QualityEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

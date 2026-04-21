import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LockScreenComponent } from './lock-screen.component';

describe('LockScreenComponent', () => {
  let component: LockScreenComponent;
  let fixture: ComponentFixture<LockScreenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LockScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LockScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

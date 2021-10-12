// return HTML Element
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

export function getElBySelector<T extends HTMLElement>(
  fixture: ComponentFixture<any>,
  selector: string
): T | null {
  return (
    (fixture.debugElement.query(By.css(selector))?.nativeElement as T) || null
  );
}

export function getElsBySelector<T extends HTMLElement>(
  fixture: ComponentFixture<any>,
  selector: string
): T[] | [] {
  return fixture.debugElement
    .queryAll(By.css(selector))
    .map((v) => v.nativeElement) as T[];
}

export function getInstancesBySelector<T>(
  fixture: ComponentFixture<any>,
  selector: string
): T[] | null[] {
  return (
    fixture.debugElement.queryAll(By.css(selector))
      .map((v) => v.componentInstance || null)
  );
}

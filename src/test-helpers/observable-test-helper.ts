import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { tick } from '@angular/core/testing';

interface ExtractParams<T> {
  obs$: Observable<T>;
}

interface ExtractValuesTake<T> extends ExtractParams<T> {
  take: number;
}

interface ExtractValuesTick<T> extends ExtractParams<T> {
  tick: number;
}

type ExtractValues<T> =
  | ExtractValuesTake<T>
  | ExtractValuesTick<T>
  | ExtractParams<T>;

export function extractValues$<T>(params: ExtractValuesTake<T>): T[];
export function extractValues$<T>(params: ExtractValuesTick<T>): T[];
export function extractValues$<T>(params: ExtractParams<T>): T[];
export function extractValues$<T>(params: ExtractValues<T>): T[] {
  const { obs$ } = params;

  const values: T[] = [];

  const failWithMessage = (err: Error) => {
    values.push(
      new Error(
        `Observable should not have emitted an error: ${err.message}`
      ) as any
    );
  };

  if (isTake(params)) {
    obs$
      .pipe(take(params.take))
      .subscribe((v) => values.push(v), failWithMessage);
    return values;
  }

  const subscription = obs$.subscribe((v) => values.push(v), failWithMessage);

  if (isTick(params)) {
    tick(params.tick);
  }
  subscription.unsubscribe();

  return values;
}

function isTick<T>(params: ExtractValues<T>): params is ExtractValuesTick<T> {
  return (params as ExtractValuesTick<T>).tick !== undefined;
}

function isTake<T>(params: ExtractValues<T>): params is ExtractValuesTake<T> {
  return (params as ExtractValuesTake<T>).take !== undefined;
}

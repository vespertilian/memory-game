import { TestBed } from '@angular/core/testing';
import { LoremPicsumService } from './lorem-picsum.service';
import { MockProvider } from 'ng-mocks';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { extractValues$ } from '../test-helpers/observable-test-helper';

describe('LoremPicsumService', () => {
  function setup({ getResult }: { getResult: Observable<any> }) {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(HttpClient, {
          get: jasmine.createSpy().and.returnValue(getResult),
        }),
      ],
    });

    const service = TestBed.inject(LoremPicsumService);
    const http = TestBed.inject(HttpClient) as HttpClient;
    return { service, http };
  }

  it('should be created', () => {
    const resultStub = [{ id: '1' }] as any;
    const { service, http } = setup({ getResult: of(resultStub) });

    const obs$ = service.getPicsumPhotosList({ limit: 1 });
    const [result] = extractValues$({ obs$ });

    expect(http.get).toHaveBeenCalledWith(
      `https://picsum.photos/v2/list/limit=1`
    );
    expect(result).toEqual(resultStub);
  });
});

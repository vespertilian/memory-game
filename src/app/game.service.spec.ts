import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GameService } from './game.service';
import { MockProvider } from 'ng-mocks';
import {
  LoremPicsumService,
  PICSUM_URL,
  PicsumPhotos,
} from './lorem-picsum.service';
import { Observable, of } from 'rxjs';
import { asyncData, asyncError } from '../test-helpers/async-data-helpers';
import { extractValues$ } from '../test-helpers/observable-test-helper';
import { COMMON_STATUS } from './status';
import { Card, GameDetails, GameState } from './game.models';
import { Spied } from '../test-helpers/spied';

interface SetupParams {
  getPicsumPhotosListResult: Observable<PicsumPhotos>;
}

describe('GameService', () => {
  function setup({ getPicsumPhotosListResult }: SetupParams) {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(LoremPicsumService, {
          getPicsumPhotosList: jasmine
            .createSpy()
            .and.returnValue(getPicsumPhotosListResult),
        }),
      ],
    });
    const loremPicsumService: Spied<LoremPicsumService> = TestBed.inject(
      LoremPicsumService
    ) as any;
    const service = TestBed.inject(GameService);
    return { service, loremPicsumService };
  }

  describe('.setup', () => {
    it('creates the game state when the data successfully loads', fakeAsync(() => {
      const { service } = setup({
        getPicsumPhotosListResult: asyncData(stubPicsumPhotosListStub),
      });

      // before setup is called the initial status is idle
      const [initStatus] = extractValues$({ obs$: service.status$ });
      expect(initStatus).toEqual(COMMON_STATUS.idle);

      // when setup is called status changes to pending
      service.setup({ numberOfCards: 7, player1Name: 'Cameron', players: 1 });
      const [pendingStatus] = extractValues$({ obs$: service.status$ });
      expect(pendingStatus).toEqual(COMMON_STATUS.pending);

      tick(); // resolve request
      const [resolvedStatus] = extractValues$({ obs$: service.status$ });
      expect(resolvedStatus).toEqual(COMMON_STATUS.resolved);

      const [gameState] = extractValues$({ obs$: service.gameState$ });

      // check overall game state
      const expectedGameState: GameState = {
        players: 1,
        player1Name: 'Cameron',
        numberOfCards: 7,
        disabled: false,
        cardOrder: jasmine.any(Array) as any,
        cards: jasmine.any(Map) as any,
        selectedIds: jasmine.any(Map) as any,
        player1Matches: jasmine.any(Set) as any,
        player2Matches: jasmine.any(Set) as any,
        currentPlayer: 1,
      };

      expect(gameState).toEqual(expectedGameState);
      expect(gameState?.cardOrder.length).toEqual(7);
      expect(gameState?.cards.size).toEqual(8);

      // check a card
      const sampleCard = gameState?.cards.get(gameState?.cardOrder[0]) as Card;
      const expectedCard = {
        id: jasmine.any(String),
        picsumId: jasmine.any(String),
        primaryImageUrl: `${PICSUM_URL}/id/${sampleCard.picsumId}/200/300`,
        grayscaleImageUrl: `${PICSUM_URL}/id/${sampleCard.picsumId}/200/300?grayscale&blur=2`,
      } as any;

      expect(sampleCard).toEqual(expectedCard);

      // should have a matching card
      const [_, cardNumber] = sampleCard.id.split('--');
      // which will have an id of 1 or 2 depending on what id the card we have has
      const matchingNumber = cardNumber === '1' ? 2 : 1;

      const matchingCard = gameState?.cards.get(
        `${sampleCard.picsumId}--${matchingNumber}`
      ) as Card;
      expect(matchingCard.picsumId).toEqual(expectedCard.picsumId);
    }));

    it('sets a rejected status if we fail to fetch the cards', fakeAsync(() => {
      const { service } = setup({
        getPicsumPhotosListResult: asyncError(new Error('service down')),
      });

      // before setup is called the initial status is idle
      const [initStatus] = extractValues$({ obs$: service.status$ });
      expect(initStatus).toEqual(COMMON_STATUS.idle);

      // when setup is called status changes to pending
      service.setup({ numberOfCards: 15, player1Name: 'Cameron', players: 1 });
      const [pendingStatus] = extractValues$({ obs$: service.status$ });
      expect(pendingStatus).toEqual(COMMON_STATUS.pending);

      tick(); // resolve request
      const [resolvedStatus] = extractValues$({ obs$: service.status$ });
      expect(resolvedStatus).toEqual(COMMON_STATUS.rejected);

      const [gameState] = extractValues$({ obs$: service.gameState$ });
      expect(gameState).toEqual(null);
    }));
  });

  describe('.ngOnDestroy', () => {
    it('clears any outstanding timeouts and calls the destroy subject', () => {
      const { service } = setup({
        getPicsumPhotosListResult: asyncData(stubPicsumPhotosListStub),
      });

      // Create a spy on global clearTimeout
      const clearTimeoutSpy = spyOn(window, 'clearTimeout');

      // Set a mock timeout ID - force the type as needed
      service.timeoutId = 1245 as any;
      const timeoutIdToCheck = service.timeoutId;

      let next: null | true = null;
      let complete: null | true = null;

      service.destroy$.subscribe(
        () => (next = true),
        fail,
        () => (complete = true)
      );

      // Call ngOnDestroy
      service.ngOnDestroy();

      // Verify clearTimeout was called with the correct ID
      expect(clearTimeoutSpy).toHaveBeenCalledWith(1245 as any);

      // Verify the destroy subject was called
      expect(next).toBeTrue();
      expect(complete).toBeTrue();
    });
  });

  describe('.gameDetails$', () => {
    it('returns game details when the status is resolved', () => {
      const { service } = setup({
        getPicsumPhotosListResult: of(stubPicsumPhotosListStub),
      });
      service.setup({ numberOfCards: 7, player1Name: 'Cameron', players: 1 });

      const [details] = extractValues$({ obs$: service.gameDetails$ });
      const expectedDetails = {
        currentPlayerName: 'Cameron',
        finishedMessage: `It's a draw!`,
        gameStatus: 'inProgress',
        player1Name: 'Cameron',
        player1Score: 0,
        player2Name: '',
        player2Score: 0,
        twoPlayers: false,
      } as GameDetails;
      expect(details).toEqual(expectedDetails);
    });

    it('returns null when status is not resolved', () => {
      const { service, loremPicsumService } = setup({
        getPicsumPhotosListResult: of(stubPicsumPhotosListStub),
      });
      service.setup({ numberOfCards: 7, player1Name: 'Cameron', players: 1 });

      loremPicsumService.getPicsumPhotosList.and.returnValue(
        asyncData(stubPicsumPhotosListStub)
      );

      // this just deals with resetting a game, otherwise the details service has no emitted any data
      service.setup({ numberOfCards: 7, player1Name: 'Cameron', players: 1 });
      const [details] = extractValues$({ obs$: service.gameDetails$ });
      expect(details).toEqual(null);
    });
  });

  describe('.selectCard', () => {
    function setupSevenCardGame({ players }: { players: 1 | 2 }) {
      const { service } = setup({
        getPicsumPhotosListResult: of(stubPicsumPhotosListStub),
      });

      service.setup({ numberOfCards: 7, player1Name: 'Cameron', players });
      return { service };
    }

    it('does nothing if the game is not setup', () => {
      const { service } = setup({ getPicsumPhotosListResult: of(null as any) });
      service.selectCard('1--1');

      const [gameState] = extractValues$({ obs$: service.gameState$ });
      expect(gameState).toEqual(null);
    });

    describe('when no card is selected', () => {
      it('adds the card to the selectedIds map', () => {
        const { service } = setupSevenCardGame({ players: 1 });
        service.selectCard('1--1');

        const [gameState] = extractValues$({ obs$: service.gameState$ });
        expect(gameState?.selectedIds.has('1--1')).toBeTrue();
        expect(gameState?.selectedIds.size).toBe(1);
      });
    });

    describe('when a card is already selected', () => {
      function setupSevenCardGameSelectFirstCard({
        players,
      }: {
        players: 1 | 2;
      }) {
        const { service } = setupSevenCardGame({ players });
        service.selectCard('1--1');
        return { service };
      }

      it('does nothing when you select an already selected card', () => {
        const { service } = setupSevenCardGameSelectFirstCard({ players: 1 });
        let results: GameState[] = [];
        const gameStateChanges = service.gameState$.subscribe((v) => {
          results.push(v as GameState);
        }, fail);

        service.selectCard('1--1');
        // game state is a behaviour subject so will always emit last value
        expect(results.length).toBe(1);
      });

      it('does nothing when you select a matched card', () => {
        const { service } = setupSevenCardGameSelectFirstCard({ players: 1 });
        service.selectCard('1--2');

        let results: GameState[] = [];
        const gameStateChanges = service.gameState$.subscribe((v) => {
          results.push(v as GameState);
        }, fail);

        service.selectCard('1--1');
        // game state is a behaviour subject so will always emit last value
        expect(results.length).toBe(1);
        // player already had this card matched
        expect(results[0].player1Matches.size).toEqual(2);
      });

      describe('single player', () => {
        describe('selecting a non matching card', () => {
          it(`the second card is added to the selectedIds,
                         then the selectedIds are reset after a short delay`, fakeAsync(() => {
            const { service } = setupSevenCardGameSelectFirstCard({
              players: 1,
            });

            let results: GameState[] = [];
            const gameStateChanges = service.gameState$.subscribe((v) => {
              results.push(v as GameState);
            }, fail);

            service.selectCard('2--1');
            const cardsSelected = results[1];

            expect(cardsSelected.selectedIds.size).toEqual(2);
            expect(cardsSelected.player1Matches.size).toEqual(0);
            expect(cardsSelected.player2Matches.size).toEqual(0);
            expect(service.timeoutId).toBeTruthy();

            tick(2000);
            const cardsCleared = results[2];
            expect(cardsCleared.selectedIds.size).toEqual(0);
            expect(cardsCleared.currentPlayer).toEqual(1);

            gameStateChanges.unsubscribe();
          }));
        });

        describe('selecting a matching card', () => {
          it(`adds both selected cards to the players "matches" set,
                         resets the selectedIds`, fakeAsync(() => {
            const { service } = setupSevenCardGameSelectFirstCard({
              players: 1,
            });

            let results: GameState[] = [];
            const gameStateChanges = service.gameState$.subscribe((v) => {
              results.push(v as GameState);
            }, fail);

            service.selectCard('1--2');
            const cardsSelected = results[1];
            expect(cardsSelected.selectedIds.size).toEqual(0);
            expect(Array.from(cardsSelected.player1Matches).sort()).toEqual([
              '1--1',
              '1--2',
            ]);
            expect(cardsSelected.player2Matches.size).toEqual(0);
            expect(results.length).toEqual(2);
            expect(service.timeoutId).toBe(null);

            gameStateChanges.unsubscribe();
          }));
        });
      });

      describe('two players', () => {
        describe('selecting a non matching card', () => {
          it(`
            the second card is added to the selectedIds,
            the player is switched
            then the selectedIds are reset after a short delay`, fakeAsync(() => {
            const { service } = setupSevenCardGameSelectFirstCard({
              players: 2,
            });

            let results: GameState[] = [];
            const gameStateChanges = service.gameState$.subscribe((v) => {
              results.push(v as GameState);
            }, fail);

            service.selectCard('2--1');
            const cardsSelected = results[1];

            expect(cardsSelected.selectedIds.size).toEqual(2);
            expect(cardsSelected.player1Matches.size).toEqual(0);
            expect(cardsSelected.player2Matches.size).toEqual(0);
            expect(cardsSelected.currentPlayer).toEqual(1);
            expect(service.timeoutId).toBeTruthy();

            tick(2000);
            const cardsCleared = results[2];
            expect(cardsCleared.selectedIds.size).toEqual(0);
            expect(cardsCleared.currentPlayer).toEqual(2);

            gameStateChanges.unsubscribe();
          }));
        });

        describe('selecting a matching card', () => {
          it(`adds both selected cards to the players "matches" set,
                         resets the selected list,
                         keeps the current player selected`, fakeAsync(() => {
            const { service } = setupSevenCardGameSelectFirstCard({
              players: 2,
            });

            let results: GameState[] = [];
            const gameStateChanges = service.gameState$.subscribe((v) => {
              results.push(v as GameState);
            }, fail);
            expect(results[0].currentPlayer).toBe(1);

            service.selectCard('1--2');
            const cardsSelected = results[1];
            expect(cardsSelected.selectedIds.size).toEqual(0);
            expect(Array.from(cardsSelected.player1Matches).sort()).toEqual([
              '1--1',
              '1--2',
            ]);
            expect(cardsSelected.player2Matches.size).toEqual(0);
            expect(cardsSelected.currentPlayer).toBe(1);
            expect(results.length).toEqual(2);
            expect(service.timeoutId).toBe(null);

            gameStateChanges.unsubscribe();
          }));
        });
      });
    });
  });
});

const stubPicsumPhotosListStub: PicsumPhotos = [
  {
    id: '1',
    author: 'Greg Rakozy',
    width: 5616,
    height: 3744,
    url: 'https://unsplash.com/photos/SSxIGsySh8o',
    download_url: 'https://picsum.photos/id/1004/5616/3744',
  },
  {
    id: '2',
    author: 'Matthew Wiebe',
    width: 5760,
    height: 3840,
    url: 'https://unsplash.com/photos/tBtuxtLvAZs',
    download_url: 'https://picsum.photos/id/1005/5760/3840',
  },
  {
    id: '3',
    author: 'Vladimir Kudinov',
    width: 3000,
    height: 2000,
    url: 'https://unsplash.com/photos/-wWRHIUklxM',
    download_url: 'https://picsum.photos/id/1006/3000/2000',
  },
  {
    id: '4',
    author: 'Benjamin Combs',
    width: 5616,
    height: 3744,
    url: 'https://unsplash.com/photos/5L4XAgMSno0',
    download_url: 'https://picsum.photos/id/1008/5616/3744',
  },
  // {
  //   id: '5',
  //   author: 'Christopher Campbell',
  //   width: 5000,
  //   height: 7502,
  //   url: 'https://unsplash.com/photos/CMWRIzyMKZk',
  //   download_url: 'https://picsum.photos/id/1009/5000/7502',
  // },
  // {
  //   id: '6',
  //   author: 'Christian Bardenhorst',
  //   width: 2621,
  //   height: 1747,
  //   url: 'https://unsplash.com/photos/8lMhzUjD1Wk',
  //   download_url: 'https://picsum.photos/id/101/2621/1747',
  // },
  // {
  //   id: '7',
  //   author: 'Samantha Sophia',
  //   width: 5184,
  //   height: 3456,
  //   url: 'https://unsplash.com/photos/NaWKMlp3tVs',
  //   download_url: 'https://picsum.photos/id/1010/5184/3456',
  // },
  // {
  //   id: '8',
  //   author: 'Roberto Nickson',
  //   width: 5472,
  //   height: 3648,
  //   url: 'https://unsplash.com/photos/7BjmDICVloE',
  //   download_url: 'https://picsum.photos/id/1011/5472/3648',
  // },
];

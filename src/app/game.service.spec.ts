import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Card, GameService, GameState } from './game.service';
import { MockProvider } from 'ng-mocks';
import { LoremPicsumService, PICSUM_URL, PicsumPhotos } from './lorem-picsum.service';
import { Observable, of } from 'rxjs';
import { asyncData, asyncError } from '../test-helpers/async-data-helpers';
import { extractValues$ } from '../test-helpers/observable-test-helper';
import { COMMON_STATUS } from './status';

interface SetupParams {
  getPicsumPhotosListResult: Observable<PicsumPhotos>
}

describe('GameService', () => {
  function setup({getPicsumPhotosListResult}: SetupParams) {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(LoremPicsumService, {
          getPicsumPhotosList: jasmine.createSpy().and.returnValue(getPicsumPhotosListResult),
        }),
      ],
    });
    const service = TestBed.inject(GameService);
    return { service };
  }

  describe('setup', () => {
    it('loads, then creates the game state', fakeAsync(() => {
      const {service} = setup({
        getPicsumPhotosListResult: asyncData(stubPicsumPhotosListStub)
      })

      // before setup is called the initial status is idle
      const [initStatus] = extractValues$({obs$: service.status$})
      expect(initStatus).toEqual(COMMON_STATUS.idle)

      // when setup is called status changes to pending
      service.setup({numberOfCards: 7, player1Name: 'Cameron', players: 1})
      const [pendingStatus] = extractValues$({obs$: service.status$})
      expect(pendingStatus).toEqual(COMMON_STATUS.pending)

      tick() // resolve request
      const [resolvedStatus] = extractValues$({obs$: service.status$})
      expect(resolvedStatus).toEqual(COMMON_STATUS.resolved)

      const [gameState] = extractValues$({obs$: service.gameState$})

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
        currentPlayer: 1
      }

      expect(gameState).toEqual(expectedGameState)
      expect(gameState?.cardOrder.length).toEqual(7)
      expect(gameState?.cards.size).toEqual(8)

      // check a card
      const sampleCard = gameState?.cards.get(gameState?.cardOrder[0]) as Card
      const expectedCard = {
        id: jasmine.any(String),
        picsumId: jasmine.any(String),
        primaryImageUrl: `${PICSUM_URL}/id/${sampleCard.picsumId}/200/300`,
        grayscaleImageUrl: `${PICSUM_URL}/id/${sampleCard.picsumId}/200/300?grayscale&blur=2`,
        matchedBy: null,
      } as any
      expect(sampleCard).toEqual(expectedCard)

      // should have a matching card
      const [_, cardNumber]= sampleCard.id.split('--')
      // which will have an id of 1 or 2 depending on what id the card we have has
      const matchingNumber = cardNumber === '1' ? 2 : 1

      const matchingCard = gameState?.cards.get(`${sampleCard.picsumId}--${matchingNumber}`) as Card
      expect(matchingCard.picsumId).toEqual(expectedCard.picsumId)
    }))

    it('loads, then sets a rejected status if we fail to fetch the cards', fakeAsync(() => {
      const {service} = setup({
        getPicsumPhotosListResult: asyncError(new Error('service down'))
      })

      // before setup is called the initial status is idle
      const [initStatus] = extractValues$({obs$: service.status$})
      expect(initStatus).toEqual(COMMON_STATUS.idle)

      // when setup is called status changes to pending
      service.setup({numberOfCards: 15, player1Name: 'Cameron', players: 1})
      const [pendingStatus] = extractValues$({obs$: service.status$})
      expect(pendingStatus).toEqual(COMMON_STATUS.pending)

      tick() // resolve request
      const [resolvedStatus] = extractValues$({obs$: service.status$})
      expect(resolvedStatus).toEqual(COMMON_STATUS.rejected)

      const [gameState] = extractValues$({obs$: service.gameState$})
      expect(gameState).toEqual(null)
    }))
  })

  describe('selectCard', () => {
    function setupSevenCardGame({players}: {players: 1 | 2}) {
      const {service} = setup({
        getPicsumPhotosListResult: of(stubPicsumPhotosListStub)
      })

      service.setup({numberOfCards: 7, player1Name: 'Cameron', players})
      return {service}
    }

    it('does nothing if the game is not setup', () => {
      const {service} = setup({getPicsumPhotosListResult: of(null as any)})
      service.selectCard('1--1')

      const [gameState] = extractValues$({obs$: service.gameState$})
      expect(gameState).toEqual(null)
    })

    describe('no cards selected', () => {
      it('adds the card to the selectedIds list', () => {
        const {service} = setupSevenCardGame({players: 1})
        service.selectCard('1--1')

        const [gameState] = extractValues$({obs$: service.gameState$})
        expect(gameState?.selectedIds.has('1--1')).toBeTrue()
        expect(gameState?.selectedIds.size).toBe(1)
      })
    })

    describe('a card already selected', () => {
      function setupSevenCardGameSelectFirstCard({players}: {players: 1 | 2}) {
        const {service} = setupSevenCardGame({players})
        service.selectCard('1--1')
        return {service}
      }

      describe('selecting a non matching card single player', () => {
        it('adds the second card to the selected list, then immediately clears the selected cards, leaving the player set to player 1', () => {
          const {service} = setupSevenCardGameSelectFirstCard({players: 1})

          let results: GameState[] = []
          const gameStateChanges = service.gameState$.subscribe(
            (v) => {
              results.push(v as GameState)
            },
            fail
          )

          service.selectCard('2--1')
          const [_, cardsSelected, cardsCleared] = results

          expect(cardsSelected.selectedIds.size).toEqual(2)
          expect(cardsSelected.player1Matches.size).toEqual(0)
          expect(cardsSelected.player2Matches.size).toEqual(0)
          expect(cardsCleared.selectedIds.size).toEqual(0)
          expect(cardsCleared.currentPlayer).toEqual(1)
        })

        it('adds the second card to the selected list, then immediately clears the selected cards, and changes the player to the other player', () => {
          const {service} = setupSevenCardGameSelectFirstCard({players: 2})

          let results: GameState[] = []
          const gameStateChanges = service.gameState$.subscribe(
            (v) => {
              results.push(v as GameState)
            },
            fail
          )

          service.selectCard('2--1')
          const [_, cardsSelected, cardsCleared] = results

          expect(cardsSelected.selectedIds.size).toEqual(2)
          expect(cardsSelected.player1Matches.size).toEqual(0)
          expect(cardsSelected.player2Matches.size).toEqual(0)
          expect(cardsCleared.selectedIds.size).toEqual(0)
          expect(cardsCleared.currentPlayer).toEqual(2)
        })
      })

      describe('selecting a matching card', () => {
        it('adds the second card to the selected list, then immediately clears the selected cards, leaving the current player selected', () => {
          const {service} = setupSevenCardGameSelectFirstCard({players: 1})

          let results: GameState[] = []
          const gameStateChanges = service.gameState$.subscribe(
            (v) => {
              results.push(v as GameState)
            },
            fail
          )

          service.selectCard('1--2')
          const [_, cardsSelected, cardsCleared] = results

          expect(cardsSelected.selectedIds.size).toEqual(2)
          expect(cardsSelected.player1Matches.size).toEqual(2)
          expect(cardsSelected.player2Matches.size).toEqual(0)
          expect(cardsCleared.selectedIds.size).toEqual(0)
        })
      })
    })
  })
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

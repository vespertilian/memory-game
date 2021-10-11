import { Injectable } from '@angular/core';
import {
  LoremPicsumService,
  PICSUM_URL,
  PicsumPhoto,
} from './lorem-picsum.service';
import { BehaviorSubject } from 'rxjs';
import { COMMON_STATUS } from './status';
import { map } from 'rxjs/operators';

interface GameParams {
  players: 1 | 2;
  player1Name: string;
  player2Name?: string;
  numberOfCards: number;
}

export interface Card {
  id: string;
  picsumId: string;
  primaryImageUrl: string;
  grayscaleImageUrl: string;
  matchedBy: null | 1 | 2;
}

interface CardData {
  cards: Map<string, Card>;
  cardOrder: string[];
}

export interface GameState extends GameParams, CardData {
  disabled: boolean;
  currentPlayer: 1 | 2;
  selectedIds: Map<string, string>;
  player1Matches: Set<string>;
  player2Matches: Set<string>;
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  _status$ = new BehaviorSubject(COMMON_STATUS.idle);
  status$ = this._status$.asObservable()
  _gameState$ = new BehaviorSubject<GameState | null>(null);
  gameState$ = this._gameState$.asObservable()

  constructor(private readonly loremPicsumService: LoremPicsumService) {}

  setup(gameParams: GameParams) {
    const limit = Math.round(gameParams.numberOfCards / 2);

    this._status$.next(COMMON_STATUS.pending);
    this.loremPicsumService
      .getPicsumPhotosList({ limit })
      .pipe(
        map((list) => {
            return list.reduce(createCard({ width: 200, height: 300 }), {
              cards: new Map(),
              cardOrder: [],
            })
        }),
        map((cardData: CardData) =>
          /// shuffle array then remove one value to make uneven
          ({
            ...cardData,
            cardOrder:
              shuffleArray(cardData.cardOrder).slice(0, -1),
          })
        )
      )
      .subscribe(
        (cardData) => {
          this._status$.next(COMMON_STATUS.resolved);
          this._gameState$.next({
            ...cardData,
            ...gameParams,
            disabled: false,
            currentPlayer: 1,
            selectedIds: new Map(),
            player1Matches: new Set(),
            player2Matches: new Set()
          });
        },
        (error) => {
          this._status$.next(COMMON_STATUS.rejected);
        }
      );
  }

  selectCard(cardId: string) {
    const gameState = this._gameState$.getValue()
    if (!isGameState(gameState)) {
      return
    }
    const cards = gameState.cards
    const selectedCard = cards.get(cardId) as Card

    if (gameState.selectedIds.size === 0) {
      gameState.selectedIds.set(cardId, selectedCard.picsumId)
      this._gameState$.next(gameState)
      return
    }

    if (gameState.selectedIds.size === 1) {
      const [[alreadySelectedId, alreadySelectedPicsumId]] = Array.from(gameState.selectedIds)
      if (alreadySelectedId === cardId) {
        return // extra click
      }

      gameState.selectedIds.set(cardId, selectedCard.picsumId)
      // emit new state with both cards selected
      this._gameState$.next(gameState)

      // if cards match add to players "Matches set"
      const matchesPreviousCard = alreadySelectedPicsumId === selectedCard.picsumId
      if (matchesPreviousCard && gameState.currentPlayer === 1) {
        gameState.player1Matches.add(cardId)
        gameState.player1Matches.add(alreadySelectedId)
      }
      if (matchesPreviousCard && gameState.currentPlayer === 2) {
        gameState.player2Matches.add(cardId)
        gameState.player2Matches.add(alreadySelectedId)
      }

      // clear selected ids by assigning a new Map()
      // handle giving users enough time to see directly in component with animations
      // not sure where to put debounce yet
      this._gameState$.next({
        ...gameState,
        selectedIds: new Map(),
        currentPlayer: swapPlayer({
          currentPlayer: gameState.currentPlayer,
          players: gameState.players
        })
      })
    }
  }
}

export function createCard({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return function _createCard(acc: CardData, listItem: PicsumPhoto): CardData {
    const id1 = `${listItem.id}--1`;
    const id2 = `${listItem.id}--2`;
    const picsumId = listItem.id;
    acc.cards.set(id1, {
      id: id1,
      picsumId,
      primaryImageUrl: createUrl({id: picsumId, width, height}),
      grayscaleImageUrl: createGrayscaleUrl({id: picsumId, width, height}),
      matchedBy: null,
    });
    acc.cards.set(id2, {
      id: id2,
      picsumId: listItem.id,
      primaryImageUrl: createUrl({id: picsumId, width, height}),
      grayscaleImageUrl: createGrayscaleUrl({id: picsumId, width, height}),
      matchedBy: null,
    });
    acc.cardOrder.push(id1);
    acc.cardOrder.push(id2);

    return acc;
  };
}

interface CreateImageUrlParams {
  id: string
  width: number
  height: number
}

function createUrl({id, width, height}: CreateImageUrlParams) {
  return `${PICSUM_URL}/id/${id}/${width}/${height}`
}

function createGrayscaleUrl(params: CreateImageUrlParams) {
  return `${createUrl(params)}?grayscale&blur=2`
}

// stack overflow special! https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray<T>(_array: T[]): T[] {
  const array = [..._array]; // lets not update the array in place ....
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isGameState(value: null | GameState): value is GameState {
  if (value !== null) {
    return true
  }
  return false
}

function swapPlayer({currentPlayer, players}: {currentPlayer: 1 | 2, players: 1 | 2}): 1 | 2 {
  if (players === 1)  {
    return 1
  }
  if (currentPlayer === 2) {
    return 1
  }
  return 2
}

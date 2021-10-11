import { Injectable, OnDestroy } from '@angular/core';
import { LoremPicsumService, } from './lorem-picsum.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { COMMON_STATUS } from './status';
import { filter, map } from 'rxjs/operators';
import { CardState, DisplayCard, GameParams, GameState } from './game.models';
import {
  cardIdToDisplayCard,
  createCardsFromPicsumPhotos, gameStateToDetails,
  gameStateToDisplayCards,
  isGameState,
  shuffleCardOrderMakeUneven,
  swapPlayer
} from './game.service.utils';

export const FLIP_BACK_IF_NOT_MATCHING_DURATION_MS = 1500

@Injectable({
  providedIn: 'root',
})
export class GameService implements OnDestroy {
  timeoutId: number | null = null

  private _status$ = new BehaviorSubject(COMMON_STATUS.idle);
  public status$ = this._status$.asObservable()
  private _gameState$ = new BehaviorSubject<GameState | null>(null);
  gameState$ = this._gameState$.asObservable()

  cards$: Observable<DisplayCard[]>  = this.gameState$.pipe(
    filter(isGameState),
    map(gameStateToDisplayCards),
  )

  gameDetails$ = this.gameState$.pipe(
    filter(isGameState),
    map(gameStateToDetails)
  )

  constructor(private readonly loremPicsumService: LoremPicsumService) {}

  setup(gameParams: GameParams) {
    const limit = Math.round(gameParams.numberOfCards / 2);

    this._status$.next(COMMON_STATUS.pending);
    this.loremPicsumService
      .getPicsumPhotosList({ limit })
      .pipe(
        map(createCardsFromPicsumPhotos({width: 200, height: 300})),
        map(shuffleCardOrderMakeUneven)
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

    const selectedCard = cardIdToDisplayCard({cardId, gameState})

    if (selectedCard.state === CardState.selected || selectedCard.state === CardState.matched) {
      // don't allow select or matched cards to be reselected
      return
    }

    if (gameState.selectedIds.size === 0) {
      gameState.selectedIds.set(cardId, selectedCard.picsumId)
      this._gameState$.next(gameState)
      return
    }

    if (gameState.selectedIds.size === 1) {
      const [[alreadySelectedId, alreadySelectedPicsumId]] = Array.from(gameState.selectedIds)

      // if cards match add to players "Matches set"
      const matchesPreviousCard = alreadySelectedPicsumId === selectedCard.picsumId

      if (matchesPreviousCard) {
        if (matchesPreviousCard && gameState.currentPlayer === 1) {
          gameState.player1Matches.add(cardId)
          gameState.player1Matches.add(alreadySelectedId)
        }
        if (matchesPreviousCard && gameState.currentPlayer === 2) {
          gameState.player2Matches.add(cardId)
          gameState.player2Matches.add(alreadySelectedId)
        }

        // reset selected ids and emit a new state
        this._gameState$.next({
          ...gameState,
          selectedIds: new Map(),
        })
        return
      }

      // if cards dont match
      // emit new state with both cards selected
      gameState.selectedIds.set(cardId, selectedCard.picsumId)
      this._gameState$.next({
        ...gameState
      })

      // wait for a couple of secs then flip cards back and change players
      this.timeoutId = setTimeout(() => {
        this._gameState$.next({
          ...gameState,
          selectedIds: new Map(),
          currentPlayer: swapPlayer({
            currentPlayer: gameState.currentPlayer,
            players: gameState.players
          })
        })
      }, FLIP_BACK_IF_NOT_MATCHING_DURATION_MS)
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }
}


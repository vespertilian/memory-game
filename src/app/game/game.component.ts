import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { DisplayCard, GAME_STATUS, GameParams } from '../game.models';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { isIdle, isPending, isRejected } from '../status';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements OnInit, OnDestroy {
  destroy$ = new Subject()
  gameStatus = GAME_STATUS

  config: GameParams | null = null;
  loading$ = this.gameService.status$
    .pipe(map((status) => isPending(status) || isIdle(status)))
  errorLoading$ = this.gameService.status$
    .pipe(map(isRejected))

  constructor(public gameService: GameService, public route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        const players = parseInt(v.get('players') || '1') as 2 | 1
        this.config = {
          players,
          player1Name: v.get('player1Name') || 'P1',
          player2Name: v.get('player2Name') || 'P1',
          numberOfCards: 15
        }
        this.gameService.setup(this.config)
      })
  }

  restartGame() {
    if (!this.config) {
      return
    }
    this.gameService.setup(this.config)
  }

  cardById(index: number, card: DisplayCard): string {
    return card.id
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

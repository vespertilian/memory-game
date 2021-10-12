import { Component, Input } from '@angular/core';
import { GameDetails } from '../game.models';

@Component({
  selector: 'app-player-details',
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.scss']
})
export class PlayerDetailsComponent {

  @Input()
  public gameDetails: GameDetails | null = null

  @Input()
  public player: 1 | 2 = 1
}

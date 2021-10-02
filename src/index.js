import './index.less';
import PacLevel from './PacLevel';

import ClassicLevelData from '../data/classicLevel';

$(document).ready(() => {
    const firstLevel = new PacLevel(ClassicLevelData);
    firstLevel.drawSimple($('#game'));
});
import './index.less';
import PacLevel from './PacLevel';

import ClassicLevelData from '../data/classicLevel';

$(document).ready(() => {
    const firstLevel = new PacLevel(ClassicLevelData, $('#game'));

    const queryParams = new URLSearchParams(window.location.search);
    const isEmbedded = Boolean(parseInt(queryParams.get('embedded'))) || (window !== window.top);
    $('body').toggleClass('embedded', isEmbedded);
});
import AmericanExpress from './assets/images/american-express.png';
import DinnersClub from './assets/images/dinclub.png';
import Discover from './assets/images/discover.png';
import jcb from './assets/images/jcb.png';
import maestro from './assets/images/maestro.png';
import MasterCard from './assets/images/MasterCard.png';
import mir from './assets/images/mir.png';
import UnionPay from './assets/images/UnionPay.png';
import visa from './assets/images/visa.png';

export function paySystem(cardNumber, imgEl) {
  if (cardNumber.startsWith('2')) {
    imgEl.src = mir;
  } else if (
    cardNumber.startsWith('30') ||
    cardNumber.startsWith('36') ||
    cardNumber.startsWith('38')
  ) {
    imgEl.src = DinnersClub;
  } else if (cardNumber.startsWith('31') || cardNumber.startsWith('35')) {
    imgEl.src = jcb;
  } else if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) {
    imgEl.src = AmericanExpress;
  } else if (cardNumber.startsWith('4')) {
    imgEl.src = visa;
  } else if (
    cardNumber.startsWith('50') ||
    cardNumber.startsWith('56') ||
    cardNumber.startsWith('57') ||
    cardNumber.startsWith('58') ||
    cardNumber.startsWith('63') ||
    cardNumber.startsWith('67')
  ) {
    imgEl.src = maestro;
  } else if (
    cardNumber.startsWith('51') ||
    cardNumber.startsWith('52') ||
    cardNumber.startsWith('53') ||
    cardNumber.startsWith('54') ||
    cardNumber.startsWith('55')
  ) {
    imgEl.src = MasterCard;
  } else if (cardNumber.startsWith('60')) {
    imgEl.src = Discover;
  } else if (cardNumber.startsWith('62')) {
    imgEl.src = UnionPay;
  }
}

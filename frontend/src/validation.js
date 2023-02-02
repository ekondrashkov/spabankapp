export function loginPassCheck(value) {
  if (value.length < 6 || /\s/.test(value)) {
    return false;
  } else return true;
}

export async function authRequest(loginInput, passInput) {
  const res = await fetch('http://localhost:3000/login/', {
    method: 'POST',
    body: JSON.stringify({
      login: loginInput,
      password: passInput,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();

  return data;
}

export function transferCountCheck(count) {
  let countCheck = true;
  if (count.length < 16) countCheck = false;
  const countArr = count.split('');
  countArr.forEach((countSymbol) => {
    if (!countSymbol.match(/[0-9]/)) countCheck = false;
  });

  return countCheck;
}

export function transferSumCheck(sum) {
  let sumCheck = true;
  const dot = [...String(sum)].filter((symbol) => symbol === '.');
  if (
    Number(sum) <= 0 ||
    dot.length > 1 ||
    String(sum).startsWith('.') ||
    String(sum).endsWith('.')
  )
    sumCheck = false;
  const sumArr = sum.split('');
  sumArr.forEach((sumSymbol) => {
    if (!sumSymbol.match(/[0-9.]/)) sumCheck = false;
  });

  return sumCheck;
}

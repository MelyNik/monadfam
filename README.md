# The Monad Fam — MNT-001 (первый экран)

**Что уже есть**
- Шапка с «Профиль» по центру
- Заголовок «The Monad Fam» + слоган
- Кнопка Start
- Карточки людей с цветной полосой снизу
- Страница /profile (разделы + статус-кнопки)
- FAQ и кнопка «Показать обучение» на главной
- Цвета в одном месте: `app/globals.css`

## Как запустить без установки программ (рекомендую)
1. Создай аккаунты на GitHub и Vercel (vercel.com).
2. На GitHub создай репозиторий `monadfam` → **Create**.
3. В репозитории **Add file → Upload files** → перетащи сюда **все файлы из архива**.
4. Нажми **Commit changes**.
5. На Vercel: **Add New → Project → Import Git Repository** → выбери `monadfam` → **Deploy**.
6. Получишь ссылку на сайт.

## Как запустить локально (если умеешь)
1. Поставь Node.js LTS.
2. В терминале:
   npm install
   npm run dev
3. Открой http://localhost:3000

## Где менять
- Цвета: `app/globals.css`
- Главная: `app/page.tsx`
- Профиль: `app/profile/page.tsx`

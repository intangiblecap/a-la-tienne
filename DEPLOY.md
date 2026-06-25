# 🚀 Déployer sur Cloudflare Pages (gratuit, sans rien installer)

Tout se fait depuis le site de Cloudflare, dans le navigateur.

## 1. Créer un compte
- Va sur https://dash.cloudflare.com/sign-up
- Crée un compte gratuit (email + mot de passe)

## 2. Créer le projet Pages
1. Dans le menu de gauche : **Workers & Pages**
2. Bouton **Create** → onglet **Pages** → **Connect to Git**
3. Autorise Cloudflare à accéder à ton GitHub
4. Choisis le dépôt **intangiblecap/a-la-tienne**
5. Réglages de build :
   - **Production branch** : `claude/ecstatic-goodall-8wwap9`
   - **Framework preset** : `None`
   - **Build command** : *(laisser vide)*
   - **Build output directory** : `/`
6. Clique **Save and Deploy**

➡️ Cloudflare te donne une URL type `a-la-tienne.pages.dev`. C'EST le lien à partager avec ton ami !

## 3. Créer la base de données KV (pour ne jamais perdre les trinquades)
1. **Workers & Pages** → onglet **KV** → **Create a namespace**
2. Nom : `trinquades` → **Add**

## 4. Connecter la base au projet
1. Retourne sur ton projet Pages (a-la-tienne)
2. **Settings** → **Functions** → **KV namespace bindings** → **Add binding**
3. - **Variable name** : `TRINQUADES` (exactement, en majuscules)
   - **KV namespace** : choisis `trinquades`
4. **Save**

## 5. Définir le mot de passe du récap secret
1. Toujours dans **Settings** → **Environment variables** (Production)
2. **Add variable** :
   - **Name** : `SECRET`
   - **Value** : choisis un mot de passe (ex : `boubou2026`)
3. **Save**

## 6. Re-déployer pour activer la base et le mot de passe
1. Onglet **Deployments** → sur le dernier déploiement, **⋯** → **Retry deployment**

## ✅ C'est en ligne !
- **Le jeu** : `https://a-la-tienne.pages.dev`
- **Le récap secret** : `https://a-la-tienne.pages.dev/api/recap?code=boubou2026`
  (remplace `boubou2026` par ton mot de passe)
- **Le récap en fichier JSON** : ajoute `&format=json` à la fin

## 🔒 Rendre le site privé (optionnel mais recommandé)
Pour que seuls toi et ton ami puissiez y accéder :
1. Projet Pages → **Settings** → **General** → cherche **Access policy**
   (ou via **Zero Trust** → **Access** → **Applications**)
2. Tu peux limiter l'accès à vos deux adresses email Google.

> Note : à chaque fois que tu pousses du code sur la branche, Cloudflare
> redéploie tout seul. Magique 🪄

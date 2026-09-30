# Live Deployment Process

When the user asks to "update it live" or "mag update sa live", they are referring to deploying the changes to their production server.
Because we don't have direct SSH access, we should provide them with the following manual deployment commands to run on their live server:

1. `cd /path/to/your/mdrrmo_project`
2. `git pull origin main`
3. `npm install`
4. `npm run build`
5. `php artisan optimize:clear` (and `php artisan view:clear`)

Do not ask what "update it live" means again. Simply output the instructions.

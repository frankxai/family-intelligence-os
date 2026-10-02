# Railway Family Workspace
Status: Docker/config-as-code packaging. No Railway template has been published and no private service has been provisioned.

Deploy from the repository root using railway.json and infra/docker/family-portal.Dockerfile. The web image includes only the template workspace, not private data.
Set the service root to /, builder to Dockerfile, and health path to /api/health. Railway supplies PORT; server binds 0.0.0.0. NODE_ENV=production. Private portal remains locked.
Commands: railway up (own code) or use Railway's GitHub source integration. Use separate private services for archive, policy gateway, OCR workers and optional models; do not include all upstream apps in the portal container.
To produce a genuine one-click button, create the tested project in Railway, create a template from that project in the Template Composer, review variable prompts and publish. Only then add its returned template code to a railway.com/new/template/<code> link. A repository/config file is not a published Railway template.
No placeholder deploy button is presented as a working template.
Rollback: redeploy the prior image/revision; private schema migrations and keys are out of scope for this template.
See https://docs.railway.com/templates/create and https://docs.railway.com/templates/publish-and-share.

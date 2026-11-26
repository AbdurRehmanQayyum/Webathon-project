CAMPUS CONNECT - DEPLOY TO AN EXISTING IIS WEBSITE
==================================================

Settings are already filled in. You do not need to edit any file.

THE SERVER NEEDS
  - SQL Server as the default instance (the app uses Server=. with Windows authentication).
  - A website with its own application pool and an HTTPS certificate.
  - The .NET 10 "Hosting Bundle": https://dotnet.microsoft.com/download/dotnet/10.0
    Run "iisreset" after installing it.

STEPS
  1. Stop the website in IIS Manager.
  2. Empty the website folder under C:\inetpub\wwwroot (default files only) and extract
     CampusConnect-site.zip straight into it. web.config and CampusConnect.Api.exe must be
     directly in that folder.
  3. Extract CampusConnect-database.zip anywhere else, for example C:\CampusConnectSetup.
     Do not put it inside the website folder.
  4. Right-click Setup.cmd and choose "Run as administrator". It must be run by a SQL Server
     administrator.

Setup.cmd finds the website by its files and then:
  - creates or updates the CampusConnectDB database,
  - gives the website's application pool account read and write access to it,
  - allows the app to write to its App_Data and logs folders,
  - sets the pool to "No Managed Code", restarts the website and checks that it answers.

FIRST SIGN-IN
  The administrator email and password are in appsettings.Production.json, under
  "AdminBootstrap". You are asked to choose a new password. A new server starts with no clubs,
  posts or students: create clubs under Administration.

UPDATE LATER
  Stop the website, extract the new site zip over the folder (keep App_Data), then run
  Setup.cmd from the new database zip.

TROUBLESHOOTING
  - HTTP Error 500.19 or 500.31: install or repair the .NET 10 Hosting Bundle, then "iisreset".
  - HTTP Error 500.35: the application pool is shared. Give this website its own pool.
  - Other errors: the "logs" folder in the website folder, and
    Event Viewer > Windows Logs > Application.

KEEP PRIVATE
  appsettings.Production.json holds the database settings, signing key, encryption key,
  storage keys and first administrator password. Do not share or publish the site zip.
  Back up the encryption key: stored content cannot be read without it.

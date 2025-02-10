const express = require('express');
const path = require('path');
const fs = require('fs');
var { chromium } = require('@playwright/test');

const app = express();
const port = 3000;



// Route pour télécharger le fichier
app.get('/', (req, res) => {

    // Création du fichier au démarrage du serveur
    const filePath = path.join(__dirname, "output.txt");

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Supprime le fichier
        console.log("Fichier existant supprimé.");
    }

    fs.appendFileSync(filePath, "DEBUT TEXTE\n", 'utf8');

    try {
        (async () => {
            var browser = await chromium.launch({ headless: true });
            var page = await browser.newPage();
        
            await page.goto('https://www.betclic.fr/football-sfootball');
            await page.waitForSelector('.list.is-sportL ist .list_content li');
        
            console.log("DEBUT");
        
            await page.waitForTimeout(2000);
        
            await page.evaluate(() => {
                var element = document.querySelector('.tc-privacy-overlay');
                if (element) {
                    element.remove();
                }
        
                var element2 = document.querySelector('.tc-privacy-override');
                if (element2) {
                    element2.remove();
                }
            });
        
            await page.waitForTimeout(2000);
        
            // Récupération des IDs des pays
            const allMenuPaysId = await page.evaluate(() => {
                let elements = document.querySelectorAll('.list.is-sportList .list_content li');
                let ids = [];
                elements.forEach(el => {
                    let id = el.getAttribute("id");
                    if (id) {
                        ids.push(id);
                    }
                });
                return ids;
            });
        
            for (const id of allMenuPaysId) {
                await page.click(`#${id}`);
                await page.waitForTimeout(1000);
                // recuperation des match par pays
                const allCompetId = await page.evaluate((param) => {
                    let elements = document.querySelectorAll('#' + param + ' ul.list_content sports-tile .list_itemWrapper');
                    let idsCompet = [];
                    elements.forEach(el => {
                        let idCompet = el.getAttribute("id");
                        if (idCompet) {
                            idsCompet.push(idCompet);
                        }
                    });
                    return idsCompet;
                }, id);
        
                for (const competId of allCompetId) {
                    await page.click(`#${competId}`);
                    await page.waitForTimeout(2000);
        
                    var sections = await page.locator('.groupEvents').all();
                    for (var section of sections) {
                        var dateMatch = await section.locator('.groupEvents_headTitle').textContent();
                        console.log("DATE DU MATCH:" + dateMatch);
                        fs.appendFileSync(filePath, " 🕠DATE DU MATCH:" + dateMatch + "\n", 'utf8');
                        var matchs = await section.locator('sports-events-event.groupEvents_card').all();
                        for (var match of matchs) {
                            var equipe1 = await match.locator('.scoreboard_contestant-1 .scoreboard_contestantLabel').textContent();
                            var equipe2 = await match.locator('.scoreboard_contestant-2 .scoreboard_contestantLabel').textContent();
                            console.log(equipe1 + " # " + equipe2);
                            fs.appendFileSync(filePath, "  👀" + equipe1 + " # " + equipe2 + "\n", 'utf8');
        
                            var lienDetail = await match.locator('a.cardEvent').getAttribute("href");
                            lienDetail = "https://www.betclic.fr" + lienDetail;
        
                            console.log(lienDetail);
        
                            // DEBUT LIEN DETAIL
                            var pageDetail = await browser.newPage();
        
                            await pageDetail.goto(lienDetail);
        
                            
                            await pageDetail.waitForSelector('sports-category-filters .tab_item');
        
                            var button = pageDetail.locator('sports-category-filters .tab_item').nth(3).locator('.tab_link');
        
                            var textTab = await button.locator('.tab_label').textContent();
        
                            if (textTab == "Buteurs"){
        
                                if (await button.count() > 0) {
                                    console.log("✅ 4ème bouton trouvé, on clique !");
                                    //privacy-overlay
                                    await pageDetail.waitForSelector('.tc-privacy-overlay');
                                    await pageDetail.evaluate(() => {
                                        var element = document.querySelector('.tc-privacy-overlay');
                                        if (element) {
                                            element.remove();
                                        }
        
                                        var element2 = document.querySelector('.tc-privacy-override');
                                        if (element2) {
                                            element2.remove();
                                        }
                                    });
                                    await button.click();
                                } else {
                                    console.log("❌ Aucun bouton trouvé !");
                                }
        
                                await pageDetail.waitForTimeout(2000);
        
                                await pageDetail.evaluate(() => {
                                    var seeMores = document.querySelectorAll('sports-split-card button.is-seeMore');
                                    for (var i = 0; i < seeMores.length; i++){
                                        seeMores[i].click();
                                    }
                                    
                                });
        
                                await pageDetail.waitForTimeout(2000);
        
                                var blocs = await pageDetail.locator('.marketElement').all();
                                for (var bloc of blocs) {
                                    if (await bloc.locator('.marketBox_headTitle').count() > 0) {
                                        var title = await bloc.locator('.marketBox_headTitle').textContent(); // a ajouter
        
                                        if (title.trim() === "Buteur (tps rég.)" || title.trim() === "Buteur ou son remplaçant (tps rég.)") {
                                            console.log(`📌 Titre : ${title.trim()}`);
                                            fs.appendFileSync(filePath, `    📌 Titre : ${title.trim()}` + "\n", 'utf8');
        
                                            var equipes = await bloc.locator("sports-split-card").all();
                                            
                                            for (var equipe of equipes) {
        
                                                if (await equipe.locator(".marketBox_bodyTitle").count() > 0) {
                                                    var nomEquipe = await equipe.locator(".marketBox_bodyTitle").textContent();
                                                    console.log("⚽ Nom Équipe: " + nomEquipe.trim());
                                                    fs.appendFileSync(filePath, "     ⚽ Nom Équipe: " + nomEquipe.trim() + "\n", 'utf8');
                                                }
        
                                                var joueurs = await equipe.locator(".marketBox_lineSelection.ng-star-inserted").all();
        
                                                for (var joueur of joueurs) {
                                                    var nomJoueur = await joueur.locator(".marketBox_label").textContent();
                                                    var coteJoueur = await joueur.locator(".btnWrapper.is-inline").textContent();
                                                    
                                                    console.log("👤 Détail Joueur: " + nomJoueur.trim() + " : " + coteJoueur.trim());
                                                }
                                            }
                                        }
        
                                        if (title.trim() === "Nombre de passes décisives du joueur") {
                                            console.log(`📌 Titre : ${title.trim()}`);
                                            fs.appendFileSync(filePath, `    📌 Titre : ${title.trim()}` + "\n", 'utf8');
        
                                            var joueurs = await bloc.locator(".marketBox_lineSelection").all();
                                            
                                            for (var joueur of joueurs) {
                                                var nom = await joueur.locator(".marketBox_label").textContent();
                                                var passe = await joueur.locator(".btnWrapper button span").nth(2).textContent();
        
                                                console.log("👤 Détail Joueur: " + nom + " : " + passe);
                                                fs.appendFileSync(filePath, "      👤 Détail Joueur: " + nom + " : " + passe + "\n", 'utf8');
                                            }
                                        }
                                    }
                                }
                            }
                            // FIN LINE DETAIL
                        }
                    }
                }
            }
        
            console.log("FIN");
        
            await browser.close();

            res.download(filePath, "competition_foot.txt", (err) => {
                if (err) {
                    console.error("Erreur de téléchargement :", err);
                    res.status(500).send("Erreur lors du téléchargement");
                }
            });
        })();
    } catch (error) {
        res.download(filePath, "competition_foot.txt", (err) => {
            if (err) {
                console.error("Erreur de téléchargement :", err);
                res.status(500).send("Erreur lors du téléchargement");
            }
        });
    }

    
});

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});

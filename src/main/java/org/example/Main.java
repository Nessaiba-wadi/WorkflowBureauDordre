package org.example;

import javax.persistence.*;
import org.example.model.*;

public class Main {
    public static void main(String[] args) {
        EntityManagerFactory entityManagerFactory = Persistence.createEntityManagerFactory("default");
        EntityManager em = entityManagerFactory.createEntityManager();

        try {
            em.getTransaction().begin();

            // Créer un rôle avec le constructeur approprié
            Role role = new Role("ROLE_USER", "Utilisateur standard");
            em.persist(role);

            // Créer l'utilisateur
            Utilisateur utilisateur = new Utilisateur();
            utilisateur.setEmail("wadinessaiba@gmail.com");
            utilisateur.setMotDePasse("Nessaiba123");
            utilisateur.setNom("WADI");
            utilisateur.setPrenom("Nessaiba");
            utilisateur.setStatut(true);
            utilisateur.setRole(role);

            em.persist(utilisateur);
            em.getTransaction().commit();

        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            e.printStackTrace();
        } finally {
            em.close();
            entityManagerFactory.close();
        }
    }
}
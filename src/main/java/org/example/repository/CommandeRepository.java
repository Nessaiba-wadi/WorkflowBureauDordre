package org.example.repository;

import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Integer> {
    List<Commande> findByUtilisateur(Utilisateur utilisateur);
    boolean existsByNumeroBC(String numeroBC);
    List<Commande> findByStatusTrue();

    // calcul de dashboard
    long countByEtatCommande(String etatCommande);

}
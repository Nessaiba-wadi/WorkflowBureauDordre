package org.example.repository;

import org.example.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {
    Utilisateur findByEmail(String email);

    @Query("SELECT u FROM Utilisateur u WHERE u.role.idRole <> :adminRoleId")
    List<Utilisateur> findAllExceptAdmins(@Param("adminRoleId") int adminRoleId);
}

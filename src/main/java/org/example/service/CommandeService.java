package org.example.service;
import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Service
public class CommandeService {
    @Autowired
    private CommandeRepository commandeRepository;
    @Value("${file.upload-dir}") // Chemin injecté depuis application.properties
    private String uploadDir;
    @Transactional
    public Commande createCommande(Commande commande, Utilisateur utilisateur, MultipartFile fichier) throws IOException {

        String roleUploadDir = "uploads/BO" ; // Adaptez selon votre structure de rôles
        Path uploadPath = Paths.get(roleUploadDir).toAbsolutePath().normalize();
        //Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Vérifier si le numéro BC existe déjà
        if (commandeRepository.existsByNumeroBC(commande.getNumeroBC())) {
            throw new RuntimeException("Une commande avec ce numéro BC existe déjà");
        }
        // Associer l'utilisateur
        commande.setUtilisateur(utilisateur);

        // Gérer le fichier si présent
        if (fichier != null && !fichier.isEmpty()) {
            String fileName = UUID.randomUUID().toString();

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Files.copy(fichier.getInputStream(), uploadPath.resolve(fileName));
            commande.setFichierJoint(fileName);
        }
        // Sauvegarder la commande
        return commandeRepository.save(commande);
    }
    public List<Commande> getCommandesByUtilisateur(Utilisateur utilisateur) {
        return commandeRepository.findByUtilisateur(utilisateur);
    }
}
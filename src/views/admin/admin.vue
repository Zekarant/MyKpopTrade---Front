<template>
  <main class="page">
    <Nav_bar></Nav_bar>
    <div class="admin">
      <!-- Header -->
      <div class="admin__header">
        <h1 class="admin__title"><i class="bi bi-shield-check"></i> Administration</h1>
      </div>

      <!-- Stats cards -->
      <div class="admin__stats">
        <div class="admin__stat-card">
          <i class="bi bi-people"></i>
          <div>
            <span class="admin__stat-value">{{ stats.totalUsers }}</span>
            <span class="admin__stat-label">Utilisateurs</span>
          </div>
        </div>
        <div class="admin__stat-card">
          <i class="bi bi-person-plus"></i>
          <div>
            <span class="admin__stat-value">{{ stats.newUsers }}</span>
            <span class="admin__stat-label">Nouveaux (30j)</span>
          </div>
        </div>
        <div class="admin__stat-card">
          <i class="bi bi-box-seam"></i>
          <div>
            <span class="admin__stat-value">{{ productStats.total }}</span>
            <span class="admin__stat-label">Produits</span>
          </div>
        </div>
        <div class="admin__stat-card admin__stat-card--success">
          <i class="bi bi-cart-check"></i>
          <div>
            <span class="admin__stat-value">{{ productStats.sold }}</span>
            <span class="admin__stat-label">Vendus</span>
          </div>
        </div>
        <div class="admin__stat-card admin__stat-card--warning">
          <i class="bi bi-flag"></i>
          <div>
            <span class="admin__stat-value">{{ pendingReportsCount }}</span>
            <span class="admin__stat-label">Signalements</span>
          </div>
        </div>
        <div class="admin__stat-card admin__stat-card--danger">
          <i class="bi bi-person-x"></i>
          <div>
            <span class="admin__stat-value">{{ stats.suspendedUsers }}</span>
            <span class="admin__stat-label">Suspendus</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="admin__tab"
          :class="{ active: currentTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
          <span v-if="tab.badge" class="admin__tab-badge">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Tab: Overview -->
      <div v-if="currentTab === 'overview'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Vue d'ensemble</h2>
        </div>
        <div class="admin__overview-grid">
          <div class="admin__overview-card">
            <h3><i class="bi bi-graph-up"></i> Activité récente</h3>
            <div class="admin__overview-list">
              <div class="admin__overview-item">
                <span class="admin__overview-label">Nouveaux produits (7j)</span>
                <span class="admin__overview-value">{{ productStats.newProducts }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Ventes récentes (30j)</span>
                <span class="admin__overview-value">{{ productStats.recentSales }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Produits disponibles</span>
                <span class="admin__overview-value">{{ productStats.available }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Produits réservés</span>
                <span class="admin__overview-value">{{ productStats.reserved }}</span>
              </div>
            </div>
          </div>
          <div class="admin__overview-card">
            <h3><i class="bi bi-pie-chart"></i> Répartition par type</h3>
            <div class="admin__overview-list">
              <div class="admin__overview-item" v-for="(count, type) in productStats.typeDistribution" :key="type">
                <span class="admin__overview-label">{{ typeLabels[type] || type }}</span>
                <span class="admin__overview-value">{{ count }}</span>
              </div>
            </div>
          </div>
          <div class="admin__overview-card admin__overview-card--highlight">
            <h3><i class="bi bi-currency-euro"></i> Revenus</h3>
            <div class="admin__revenue">
              <span class="admin__revenue-value">{{ productStats.totalRevenue?.toFixed(2) || '0.00' }} €</span>
              <span class="admin__revenue-label">Volume total des ventes</span>
            </div>
          </div>
          <div class="admin__overview-card">
            <h3><i class="bi bi-people-fill"></i> Utilisateurs</h3>
            <div class="admin__overview-list">
              <div class="admin__overview-item">
                <span class="admin__overview-label">Total</span>
                <span class="admin__overview-value">{{ stats.totalUsers }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Actifs</span>
                <span class="admin__overview-value">{{ stats.activeUsers }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Suspendus</span>
                <span class="admin__overview-value admin__overview-value--danger">{{ stats.suspendedUsers }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Nouveaux (30j)</span>
                <span class="admin__overview-value admin__overview-value--success">{{ stats.newUsers }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Reports -->
      <div v-if="currentTab === 'reports'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Signalements</h2>
          <div class="admin__filters">
            <select v-model="reportFilter" @change="loadReports">
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="reviewed">Examiné</option>
              <option value="resolved">Résolu</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>
        <div v-if="reports.length === 0" class="admin__empty">
          <i class="bi bi-check-circle"></i>
          <p>Aucun signalement</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Signaleur</th>
                <th>Type</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in reports" :key="report._id">
                <td>
                  <span class="admin__user-cell">
                    {{ report.reporter?.username || 'Inconnu' }}
                  </span>
                </td>
                <td><span class="admin__badge">{{ report.targetType }}</span></td>
                <td>{{ reasonLabels[report.reason] || report.reason }}</td>
                <td><span class="admin__status" :class="'admin__status--' + report.status">{{ statusLabels[report.status] }}</span></td>
                <td>{{ formatDate(report.createdAt) }}</td>
                <td>
                  <div class="admin__actions">
                    <button v-if="report.status === 'pending'" class="admin__action-btn admin__action-btn--success" @click="handleReport(report._id, 'resolved')" title="Résoudre">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button v-if="report.status === 'pending'" class="admin__action-btn admin__action-btn--danger" @click="handleReport(report._id, 'rejected')" title="Rejeter">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Users -->
      <div v-if="currentTab === 'users'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Utilisateurs</h2>
          <div class="admin__filters">
            <input type="text" v-model="userSearch" @input="debouncedLoadUsers" placeholder="Rechercher..." class="admin__search-input" />
            <select v-model="userRoleFilter" @change="loadUsers">
              <option value="">Tous les rôles</option>
              <option value="user">Utilisateur</option>
              <option value="moderator">Modérateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div v-if="users.length === 0" class="admin__empty">
          <i class="bi bi-people"></i>
          <p>Aucun utilisateur trouvé</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user._id">
                <td>
                  <div class="admin__user-cell">
                    <img v-if="user.profilePicture && !user.profilePicture.includes('avatar-default')" :src="apiUrl + user.profilePicture" class="admin__avatar" />
                    <span v-else class="admin__avatar-letter">{{ getInitial(user.username) }}</span>
                    {{ user.username }}
                    <i v-if="user.isIdentityVerified" class="bi bi-patch-check-fill admin__verified"></i>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <select
                    :value="user.role"
                    @change="changeUserRole(user._id, ($event.target as HTMLSelectElement).value)"
                    class="admin__inline-select"
                    :disabled="user.role === 'admin'"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="moderator">Modérateur</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span class="admin__status" :class="'admin__status--' + user.accountStatus">
                    {{ user.accountStatus === 'active' ? 'Actif' : user.accountStatus === 'suspended' ? 'Suspendu' : 'Supprimé' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>
                  <div class="admin__actions">
                    <button
                      v-if="user.accountStatus === 'active' && user.role !== 'admin'"
                      class="admin__action-btn admin__action-btn--danger"
                      @click="toggleUserStatus(user._id, 'suspended')"
                      title="Suspendre"
                    >
                      <i class="bi bi-person-x"></i>
                    </button>
                    <button
                      v-if="user.accountStatus === 'suspended'"
                      class="admin__action-btn admin__action-btn--success"
                      @click="toggleUserStatus(user._id, 'active')"
                      title="Réactiver"
                    >
                      <i class="bi bi-person-check"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="usersPagination.totalPages > 1" class="admin__pagination">
          <button :disabled="usersPagination.page <= 1" @click="usersPage--; loadUsers()">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span>{{ usersPagination.page }} / {{ usersPagination.totalPages }}</span>
          <button :disabled="usersPagination.page >= usersPagination.totalPages" @click="usersPage++; loadUsers()">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Tab: Products -->
      <div v-if="currentTab === 'products'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Produits</h2>
          <div class="admin__filters">
            <input type="text" v-model="productSearch" @input="debouncedLoadProducts" placeholder="Rechercher..." class="admin__search-input" />
            <select v-model="productStatusFilter" @change="loadProducts">
              <option value="">Tous</option>
              <option value="available">Disponible</option>
              <option value="sold">Vendu</option>
              <option value="reserved">Réservé</option>
            </select>
            <select v-model="productTypeFilter" @change="loadProducts">
              <option value="">Tous types</option>
              <option value="photocard">Photocard</option>
              <option value="album">Album</option>
              <option value="merch">Merch</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>
        <div v-if="products.length === 0" class="admin__empty">
          <i class="bi bi-box-seam"></i>
          <p>Aucun produit trouvé</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Vendeur</th>
                <th>Prix</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product._id">
                <td>
                  <div class="admin__product-cell">
                    <img v-if="product.images?.length" :src="apiUrl + product.images[0]" class="admin__product-img" />
                    <span>{{ product.title }}</span>
                  </div>
                </td>
                <td>{{ product.seller?.username || 'Inconnu' }}</td>
                <td class="admin__price">{{ product.price }}{{ product.currency === 'EUR' ? '€' : '$' }}</td>
                <td><span class="admin__badge">{{ typeLabels[product.type] || product.type }}</span></td>
                <td>
                  <span class="admin__status" :class="productStatusClass(product)">
                    {{ productStatusLabel(product) }}
                  </span>
                </td>
                <td>{{ formatDate(product.createdAt) }}</td>
                <td>
                  <div class="admin__actions">
                    <button class="admin__action-btn admin__action-btn--danger" @click="deleteProduct(product._id)" title="Supprimer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="productsPagination.totalPages > 1" class="admin__pagination">
          <button :disabled="productsPagination.page <= 1" @click="productsPage--; loadProducts()">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span>{{ productsPagination.page }} / {{ productsPagination.totalPages }}</span>
          <button :disabled="productsPagination.page >= productsPagination.totalPages" @click="productsPage++; loadProducts()">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Tab: Verifications -->
      <div v-if="currentTab === 'verifications'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Vérifications d'identité</h2>
        </div>
        <div v-if="verifications.length === 0" class="admin__empty">
          <i class="bi bi-patch-check"></i>
          <p>Aucune vérification en attente</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Type</th>
                <th>Soumis le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="verif in verifications" :key="verif._id">
                <td>{{ verif.user?.username || 'Inconnu' }}</td>
                <td>{{ verif.verificationType || 'Identité' }}</td>
                <td>{{ formatDate(verif.createdAt) }}</td>
                <td>
                  <div class="admin__actions">
                    <button class="admin__action-btn admin__action-btn--success" @click="approveVerif(verif._id)" title="Approuver">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="admin__action-btn admin__action-btn--danger" @click="rejectVerif(verif._id)" title="Rejeter">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: Modération Posts -->
      <div v-if="currentTab === 'moderation'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Modération des posts</h2>
        </div>
        <div class="admin__stats-grid" style="margin-bottom: var(--space-lg);">
          <div class="admin__stat-card">
            <div class="admin__stat-value">{{ postStats.totalPosts }}</div>
            <div class="admin__stat-label">Posts</div>
          </div>
          <div class="admin__stat-card">
            <div class="admin__stat-value">{{ postStats.totalReplies }}</div>
            <div class="admin__stat-label">Réponses</div>
          </div>
          <div class="admin__stat-card">
            <div class="admin__stat-value">{{ postStats.todayPosts }}</div>
            <div class="admin__stat-label">Posts aujourd'hui</div>
          </div>
        </div>
        <div class="admin__filters">
          <input type="text" v-model="modPostSearch" @input="loadModPosts()" placeholder="Rechercher un contenu..." class="admin__search" />
          <select v-model="modPostType" @change="loadModPosts()" class="admin__select">
            <option value="">Tous</option>
            <option value="post">Posts uniquement</option>
            <option value="reply">Réponses uniquement</option>
          </select>
        </div>
        <div v-if="modPosts.length === 0" class="admin__empty">
          <i class="bi bi-chat-left-text"></i>
          <p>Aucun post trouvé</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Auteur</th>
                <th>Contenu</th>
                <th>Type</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in modPosts" :key="post._id">
                <td>
                  <div class="admin__user-cell">
                    <img v-if="post.author?.profilePicture && !post.author.profilePicture.includes('avatar-default')" :src="apiUrl + post.author.profilePicture" class="admin__avatar" />
                    <span v-else class="admin__avatar-letter">{{ getInitial(post.author?.username) }}</span>
                    {{ post.author?.username || 'Supprimé' }}
                    <i v-if="post.author?.isIdentityVerified" class="bi bi-patch-check-fill admin__verified"></i>
                  </div>
                </td>
                <td>
                  <span class="admin__content-preview">{{ post.content?.substring(0, 80) }}{{ post.content?.length > 80 ? '...' : '' }}</span>
                </td>
                <td>
                  <span class="admin__badge" :class="post.isReply ? 'admin__badge--info' : 'admin__badge--neutral'">
                    {{ post.isReply ? 'Réponse' : 'Post' }}
                  </span>
                </td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <button class="admin__action-btn admin__action-btn--danger" @click="deleteModPost(post._id)" title="Supprimer">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="modPostsPagination.totalPages > 1" class="admin__pagination">
            <button :disabled="modPostsPage <= 1" @click="modPostsPage--; loadModPosts()">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span>{{ modPostsPage }} / {{ modPostsPagination.totalPages }}</span>
            <button :disabled="modPostsPage >= modPostsPagination.totalPages" @click="modPostsPage++; loadModPosts()">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab: RGPD -->
      <div v-if="currentTab === 'rgpd'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>RGPD & Données personnelles</h2>
        </div>
        <div class="admin__rgpd-grid">
          <div class="admin__rgpd-card">
            <h3><i class="bi bi-download"></i> Export des données utilisateur</h3>
            <p>Exporter l'ensemble des données personnelles d'un utilisateur (droit d'accès Art. 15).</p>
            <div class="admin__rgpd-action">
              <input type="text" v-model="rgpdUserSearch" placeholder="Pseudo ou email de l'utilisateur..." class="admin__search-input" />
              <button class="admin__btn admin__btn--primary" @click="exportUserData" :disabled="!rgpdUserSearch.trim()">
                <i class="bi bi-file-earmark-zip"></i> Exporter
              </button>
            </div>
          </div>
          <div class="admin__rgpd-card">
            <h3><i class="bi bi-person-slash"></i> Anonymisation</h3>
            <p>Anonymiser les données d'un utilisateur tout en conservant les transactions (droit à l'effacement Art. 17).</p>
            <div class="admin__rgpd-action">
              <input type="text" v-model="rgpdAnonymizeSearch" placeholder="Pseudo ou email..." class="admin__search-input" />
              <button class="admin__btn admin__btn--danger" @click="anonymizeUser" :disabled="!rgpdAnonymizeSearch.trim()">
                <i class="bi bi-incognito"></i> Anonymiser
              </button>
            </div>
          </div>
          <div class="admin__rgpd-card">
            <h3><i class="bi bi-clock-history"></i> Demandes de suppression</h3>
            <p>Utilisateurs ayant demandé la suppression de leur compte.</p>
            <div v-if="deletionRequests.length === 0" class="admin__empty" style="padding: var(--space-md);">
              <p>Aucune demande en attente</p>
            </div>
            <div v-else class="admin__rgpd-list">
              <div class="admin__rgpd-item" v-for="req in deletionRequests" :key="req._id">
                <div>
                  <strong>{{ req.username }}</strong>
                  <span class="admin__text-muted"> — planifiée le {{ formatDate(req.scheduledDeletionDate) }}</span>
                </div>
                <div class="admin__actions">
                  <button class="admin__action-btn admin__action-btn--danger" @click="confirmDeletion(req._id)" title="Confirmer la suppression">
                    <i class="bi bi-trash"></i>
                  </button>
                  <button class="admin__action-btn admin__action-btn--success" @click="cancelDeletion(req._id)" title="Annuler la demande">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="admin__rgpd-card">
            <h3><i class="bi bi-shield-check"></i> Consentements</h3>
            <p>Statistiques sur les consentements utilisateurs.</p>
            <div class="admin__overview-list">
              <div class="admin__overview-item">
                <span class="admin__overview-label">Politique acceptée</span>
                <span class="admin__overview-value">{{ rgpdStats.privacyAccepted }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Traitement données</span>
                <span class="admin__overview-value">{{ rgpdStats.dataProcessing }}</span>
              </div>
              <div class="admin__overview-item">
                <span class="admin__overview-label">Marketing</span>
                <span class="admin__overview-value">{{ rgpdStats.marketing }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: K-pop -->
      <div v-if="currentTab === 'kpop'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Gestion K-pop</h2>
        </div>

        <!-- Sub-tabs Groups / Albums -->
        <div class="admin__sub-tabs">
          <button
            :class="['admin__sub-tab', { 'admin__sub-tab--active': kpopSubTab === 'groups' }]"
            @click="kpopSubTab = 'groups'"
          >
            <i class="bi bi-people-fill"></i> Groupes ({{ kpopGroups.length }})
          </button>
          <button
            :class="['admin__sub-tab', { 'admin__sub-tab--active': kpopSubTab === 'albums' }]"
            @click="kpopSubTab = 'albums'"
          >
            <i class="bi bi-disc"></i> Albums ({{ kpopAlbums.length }})
          </button>
        </div>

        <!-- Groups sub-panel -->
        <div v-if="kpopSubTab === 'groups'">
          <div class="admin__toolbar">
            <input
              v-model="kpopGroupSearch"
              @input="debouncedSearchGroups"
              type="text"
              class="admin__search-input"
              placeholder="Rechercher un groupe..."
            />
            <button class="admin__btn admin__btn--primary" @click="openGroupForm()">
              <i class="bi bi-plus-lg"></i> Ajouter
            </button>
          </div>

          <div v-if="kpopGroups.length === 0" class="admin__empty">
            <i class="bi bi-people"></i>
            <p>Aucun groupe trouvé</p>
          </div>
          <div v-else class="admin__table-wrapper">
            <table class="admin__table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Membres</th>
                  <th>Followers</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="group in kpopGroups" :key="group._id">
                  <td>
                    <div class="admin__user-cell">
                      <img v-if="group.image" :src="group.image" class="admin__kpop-thumb" alt="" />
                      <span v-else class="admin__avatar-letter">{{ getInitial(group.name) }}</span>
                      {{ group.name }}
                    </div>
                  </td>
                  <td>{{ group.members?.length || 0 }}</td>
                  <td>{{ group.followersCount || 0 }}</td>
                  <td>
                    <button class="admin__action-btn" @click="viewGroupFollowers(group)" title="Voir followers">
                      <i class="bi bi-people"></i>
                    </button>
                    <button class="admin__action-btn" @click="openGroupForm(group)" title="Modifier">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="admin__action-btn admin__action-btn--danger" @click="handleDeleteGroup(group._id)" title="Supprimer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Albums sub-panel -->
        <div v-if="kpopSubTab === 'albums'">
          <div class="admin__toolbar">
            <input
              v-model="kpopAlbumSearch"
              @input="debouncedSearchAlbums"
              type="text"
              class="admin__search-input"
              placeholder="Rechercher un album..."
            />
            <button class="admin__btn admin__btn--primary" @click="openAlbumForm()">
              <i class="bi bi-plus-lg"></i> Ajouter
            </button>
          </div>

          <div v-if="kpopAlbums.length === 0" class="admin__empty">
            <i class="bi bi-disc"></i>
            <p>Aucun album trouvé</p>
          </div>
          <div v-else class="admin__table-wrapper">
            <table class="admin__table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Groupe</th>
                  <th>Type</th>
                  <th>Date de sortie</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="album in kpopAlbums" :key="album._id">
                  <td>
                    <div class="admin__user-cell">
                      <img v-if="album.coverImage" :src="album.coverImage" class="admin__kpop-thumb" alt="" />
                      <span v-else class="admin__avatar-letter">{{ getInitial(album.name) }}</span>
                      {{ album.name }}
                    </div>
                  </td>
                  <td>{{ album.artistName || '—' }}</td>
                  <td><span class="admin__badge admin__badge--info">{{ album.albumType || '—' }}</span></td>
                  <td>{{ album.releaseDate ? formatDate(album.releaseDate) : '—' }}</td>
                  <td>
                    <button class="admin__action-btn" @click="openAlbumForm(album)" title="Modifier">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="admin__action-btn admin__action-btn--danger" @click="handleDeleteAlbum(album._id)" title="Supprimer">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Group form -->
        <div v-if="showGroupForm" class="admin__modal-overlay" @click.self="showGroupForm = false">
          <div class="admin__modal">
            <h3>{{ editingGroup ? 'Modifier le groupe' : 'Nouveau groupe' }}</h3>
            <form @submit.prevent="submitGroup">
              <div class="admin__form-group">
                <label>Nom *</label>
                <input v-model="groupForm.name" type="text" required class="admin__input" />
              </div>
              <div class="admin__form-group">
                <label>Image (URL)</label>
                <input v-model="groupForm.image" type="text" class="admin__input" placeholder="https://..." />
              </div>
              <div class="admin__form-group">
                <label>Membres (séparés par virgule)</label>
                <input v-model="groupForm.membersRaw" type="text" class="admin__input" placeholder="Jisoo, Jennie, Rosé, Lisa" />
              </div>
              <div class="admin__modal-actions">
                <button type="button" class="admin__btn" @click="showGroupForm = false">Annuler</button>
                <button type="submit" class="admin__btn admin__btn--primary">{{ editingGroup ? 'Modifier' : 'Créer' }}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal Album form -->
        <div v-if="showAlbumForm" class="admin__modal-overlay" @click.self="showAlbumForm = false">
          <div class="admin__modal">
            <h3>{{ editingAlbum ? 'Modifier l\'album' : 'Nouvel album' }}</h3>
            <form @submit.prevent="submitAlbum">
              <div class="admin__form-group">
                <label>Nom *</label>
                <input v-model="albumForm.name" type="text" required class="admin__input" />
              </div>
              <div class="admin__form-group">
                <label>Groupe</label>
                <select v-model="albumForm.group" class="admin__select">
                  <option value="">— Aucun —</option>
                  <option v-for="g in kpopGroups" :key="g._id" :value="g._id">{{ g.name }}</option>
                </select>
              </div>
              <div class="admin__form-group">
                <label>Type</label>
                <select v-model="albumForm.type" class="admin__select">
                  <option value="">—</option>
                  <option value="mini">Mini Album</option>
                  <option value="full">Full Album</option>
                  <option value="single">Single</option>
                  <option value="repackage">Repackage</option>
                  <option value="special">Special</option>
                </select>
              </div>
              <div class="admin__form-group">
                <label>Date de sortie</label>
                <input v-model="albumForm.releaseDate" type="date" class="admin__input" />
              </div>
              <div class="admin__form-group">
                <label>Cover (URL)</label>
                <input v-model="albumForm.coverImage" type="text" class="admin__input" placeholder="https://..." />
              </div>
              <div class="admin__modal-actions">
                <button type="button" class="admin__btn" @click="showAlbumForm = false">Annuler</button>
                <button type="submit" class="admin__btn admin__btn--primary">{{ editingAlbum ? 'Modifier' : 'Créer' }}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal Followers -->
        <div v-if="showFollowersModal" class="admin__modal-overlay" @click.self="showFollowersModal = false">
          <div class="admin__modal">
            <h3>Followers de {{ followersGroupName }}</h3>
            <div v-if="groupFollowers.length === 0" class="admin__empty" style="padding: var(--space-lg) 0;">
              <p>Aucun follower</p>
            </div>
            <ul v-else class="admin__followers-list">
              <li v-for="f in groupFollowers" :key="f._id" class="admin__follower-item">
                <span class="admin__avatar-letter">{{ getInitial(f.username) }}</span>
                <span>{{ f.username }}</span>
              </li>
            </ul>
            <div class="admin__modal-actions">
              <button class="admin__btn" @click="showFollowersModal = false">Fermer</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Audit -->
      <div v-if="currentTab === 'audit'" class="admin__panel">
        <div class="admin__panel-header">
          <h2>Journal d'audit</h2>
        </div>
        <div class="admin__stats-grid" style="margin-bottom: var(--space-lg);">
          <div class="admin__stat-card">
            <div class="admin__stat-value">{{ auditStats.todayActions }}</div>
            <div class="admin__stat-label">Actions aujourd'hui</div>
          </div>
          <div class="admin__stat-card">
            <div class="admin__stat-value">{{ auditStats.weekActions }}</div>
            <div class="admin__stat-label">Cette semaine</div>
          </div>
        </div>
        <div class="admin__filters">
          <select v-model="auditFilter" @change="auditPage = 1; loadAuditLogs()" class="admin__select">
            <option value="">Toutes les actions</option>
            <option value="user">Utilisateurs</option>
            <option value="product">Produits</option>
            <option value="post">Posts</option>
            <option value="report">Signalements</option>
            <option value="verification">Vérifications</option>
          </select>
        </div>
        <div v-if="auditLogs.length === 0" class="admin__empty">
          <i class="bi bi-journal-text"></i>
          <p>Aucune action enregistrée</p>
        </div>
        <div v-else class="admin__table-wrapper">
          <table class="admin__table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Type</th>
                <th>Détails</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in auditLogs" :key="log._id">
                <td>
                  <div class="admin__user-cell">
                    <span class="admin__avatar-letter">{{ getInitial(log.admin?.username) }}</span>
                    {{ log.admin?.username || 'Système' }}
                  </div>
                </td>
                <td><span class="admin__badge admin__badge--neutral">{{ log.action }}</span></td>
                <td><span class="admin__badge admin__badge--info">{{ log.targetType }}</span></td>
                <td><span class="admin__content-preview">{{ log.details || '—' }}</span></td>
                <td>{{ formatDate(log.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="auditPagination.totalPages > 1" class="admin__pagination">
            <button :disabled="auditPage <= 1" @click="auditPage--; loadAuditLogs()">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span>{{ auditPage }} / {{ auditPagination.totalPages }}</span>
            <button :disabled="auditPage >= auditPagination.totalPages" @click="auditPage++; loadAuditLogs()">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import Nav_bar from '@/components/adherents/nav_bar.vue';
  import authentificationService from '@/services/authentification.service';
  import adminService from '@/services/admin.service';
  import albumService from '@/services/album.service';
  import groupService from '@/services/group.service';
  import { func } from '@/function';
  import { API_URL } from '@/config/api';

  export default defineComponent({
    name: 'admin',
    components: { Nav_bar },
    setup() {
      const router = useRouter();
      const apiUrl = API_URL;
      const currentTab = ref('overview');
      const stats = ref({ totalUsers: 0, newUsers: 0, suspendedUsers: 0, activeUsers: 0 });
      const productStats = ref({ total: 0, available: 0, sold: 0, reserved: 0, newProducts: 0, recentSales: 0, totalRevenue: 0, typeDistribution: {} as Record<string, number> });

      // Reports
      const reports = ref<any[]>([]);
      const reportFilter = ref('pending');
      const pendingReportsCount = ref(0);

      // Users
      const users = ref<any[]>([]);
      const userSearch = ref('');
      const userRoleFilter = ref('');
      const usersPage = ref(1);
      const usersPagination = ref({ page: 1, totalPages: 1 });

      // Products
      const products = ref<any[]>([]);
      const productSearch = ref('');
      const productStatusFilter = ref('');
      const productTypeFilter = ref('');
      const productsPage = ref(1);
      const productsPagination = ref({ page: 1, totalPages: 1 });

      // Verifications
      const verifications = ref<any[]>([]);

      // RGPD
      const rgpdUserSearch = ref('');
      const rgpdAnonymizeSearch = ref('');
      const deletionRequests = ref<any[]>([]);
      const rgpdStats = ref({ privacyAccepted: 0, dataProcessing: 0, marketing: 0 });

      // Modération posts
      const modPosts = ref<any[]>([]);
      const modPostSearch = ref('');
      const modPostType = ref('');
      const modPostsPage = ref(1);
      const modPostsPagination = ref({ page: 1, totalPages: 1 });
      const postStats = ref({ totalPosts: 0, totalReplies: 0, todayPosts: 0 });

      // Audit
      const auditLogs = ref<any[]>([]);
      const auditFilter = ref('');
      const auditPage = ref(1);
      const auditPagination = ref({ page: 1, totalPages: 1 });
      const auditStats = ref({ todayActions: 0, weekActions: 0, byType: {} as Record<string, number> });

      // K-pop
      const kpopSubTab = ref('groups');
      const kpopGroups = ref<any[]>([]);
      const kpopAlbums = ref<any[]>([]);
      const kpopGroupSearch = ref('');
      const kpopAlbumSearch = ref('');
      const showGroupForm = ref(false);
      const showAlbumForm = ref(false);
      const editingGroup = ref<any>(null);
      const editingAlbum = ref<any>(null);
      const groupForm = ref({ name: '', image: '', membersRaw: '' });
      const albumForm = ref({ name: '', group: '', type: '', releaseDate: '', coverImage: '' });
      const showFollowersModal = ref(false);
      const groupFollowers = ref<any[]>([]);
      const followersGroupName = ref('');

      const tabs = computed(() => [
        { id: 'overview', label: 'Vue d\'ensemble', icon: 'bi bi-speedometer2', badge: null },
        { id: 'reports', label: 'Signalements', icon: 'bi bi-flag', badge: pendingReportsCount.value || null },
        { id: 'users', label: 'Utilisateurs', icon: 'bi bi-people', badge: null },
        { id: 'products', label: 'Produits', icon: 'bi bi-box-seam', badge: null },
        { id: 'moderation', label: 'Modération', icon: 'bi bi-chat-left-text', badge: null },
        { id: 'verifications', label: 'Vérifications', icon: 'bi bi-patch-check', badge: verifications.value.length || null },
        { id: 'kpop', label: 'K-pop', icon: 'bi bi-music-note-beamed', badge: null },
        { id: 'rgpd', label: 'RGPD', icon: 'bi bi-shield-lock', badge: deletionRequests.value.length || null },
        { id: 'audit', label: 'Audit', icon: 'bi bi-journal-text', badge: null },
      ]);

      const typeLabels: Record<string, string> = {
        photocard: 'Photocard',
        album: 'Album',
        merch: 'Merch',
        other: 'Autre',
      };

      const reasonLabels: Record<string, string> = {
        inappropriate_content: 'Contenu inapproprié',
        offensive_language: 'Langage offensant',
        false_information: 'Fausses informations',
        spam: 'Spam',
        fraud: 'Fraude',
        copyright_violation: 'Droit d\'auteur',
        other: 'Autre',
      };

      const statusLabels: Record<string, string> = {
        pending: 'En attente',
        reviewed: 'Examiné',
        resolved: 'Résolu',
        rejected: 'Rejeté',
      };

      const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const productStatusClass = (product: any) => {
        if (product.isSold) return 'admin__status--resolved';
        if (product.isReserved) return 'admin__status--reviewed';
        if (product.isAvailable) return 'admin__status--active';
        return '';
      };

      const productStatusLabel = (product: any) => {
        if (product.isSold) return 'Vendu';
        if (product.isReserved) return 'Réservé';
        return 'Disponible';
      };

      const switchTab = (tabId: string) => {
        currentTab.value = tabId;
        if (tabId === 'products' && products.value.length === 0) loadProducts();
        if (tabId === 'rgpd') loadRgpdData();
        if (tabId === 'moderation') loadModPosts();
        if (tabId === 'audit') loadAuditLogs();
        if (tabId === 'kpop') loadKpopData();
      };

      // === Loaders ===
      const loadStats = async () => {
        try {
          stats.value = await adminService.getStats();
        } catch (e) { /* ignore */ }
      };

      const loadProductStats = async () => {
        try {
          productStats.value = await adminService.getProductStats();
        } catch (e) { /* ignore */ }
      };

      const loadReports = async () => {
        try {
          const data = await adminService.getReports({ status: reportFilter.value || undefined, limit: 50 });
          reports.value = data.reports || [];
          if (reportFilter.value === 'pending' || !reportFilter.value) {
            pendingReportsCount.value = data.pagination?.totalItems || reports.value.length;
          }
        } catch (e) { reports.value = []; }
      };

      const loadUsers = async () => {
        try {
          const data = await adminService.getUsers({
            page: usersPage.value,
            search: userSearch.value || undefined,
            role: userRoleFilter.value || undefined,
            limit: 20
          });
          users.value = data.users || [];
          usersPagination.value = data.pagination || { page: 1, totalPages: 1 };
        } catch (e) { users.value = []; }
      };

      const loadProducts = async () => {
        try {
          const data = await adminService.getProducts({
            page: productsPage.value,
            search: productSearch.value || undefined,
            status: productStatusFilter.value || undefined,
            type: productTypeFilter.value || undefined,
            limit: 20
          });
          products.value = data.products || [];
          productsPagination.value = data.pagination || { page: 1, totalPages: 1 };
        } catch (e) { products.value = []; }
      };

      const loadVerifications = async () => {
        try {
          const data = await adminService.getPendingVerifications();
          verifications.value = data.verifications || data || [];
        } catch (e) { verifications.value = []; }
      };

      let debounceTimer: any = null;
      const debouncedLoadUsers = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          usersPage.value = 1;
          loadUsers();
        }, 300);
      };

      let productDebounceTimer: any = null;
      const debouncedLoadProducts = () => {
        clearTimeout(productDebounceTimer);
        productDebounceTimer = setTimeout(() => {
          productsPage.value = 1;
          loadProducts();
        }, 300);
      };

      // === Actions ===
      const handleReport = async (reportId: string, status: string) => {
        try {
          await adminService.updateReportStatus(reportId, status);
          func.showToastSuccess('Signalement mis à jour');
          loadReports();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const toggleUserStatus = async (userId: string, status: 'active' | 'suspended') => {
        try {
          await adminService.updateUserStatus(userId, status);
          func.showToastSuccess(status === 'suspended' ? 'Utilisateur suspendu' : 'Utilisateur réactivé');
          loadUsers();
          loadStats();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const changeUserRole = async (userId: string, role: string) => {
        try {
          await adminService.updateUserRole(userId, role as any);
          func.showToastSuccess('Rôle modifié');
          loadUsers();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const deleteProduct = async (productId: string) => {
        if (!confirm('Supprimer ce produit définitivement ?')) return;
        try {
          await adminService.deleteProduct(productId);
          func.showToastSuccess('Produit supprimé');
          loadProducts();
          loadProductStats();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const approveVerif = async (id: string) => {
        try {
          await adminService.approveVerification(id);
          func.showToastSuccess('Vérification approuvée');
          loadVerifications();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const rejectVerif = async (id: string) => {
        const reason = prompt('Raison du rejet :');
        if (!reason) return;
        try {
          await adminService.rejectVerification(id, reason);
          func.showToastSuccess('Vérification rejetée');
          loadVerifications();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      // === RGPD ===
      const loadRgpdData = async () => {
        try {
          const [deletions, consentStats] = await Promise.all([
            adminService.getDeletionRequests(),
            adminService.getRgpdStats()
          ]);
          deletionRequests.value = deletions.users || [];
          rgpdStats.value = consentStats;
        } catch (e) { /* ignore */ }
      };

      const exportUserData = async () => {
        if (!rgpdUserSearch.value.trim()) return;
        try {
          const data = await adminService.exportUserData(rgpdUserSearch.value.trim());
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `user-data-${rgpdUserSearch.value.trim()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          func.showToastSuccess('Export généré');
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Utilisateur introuvable');
        }
      };

      const anonymizeUser = async () => {
        if (!rgpdAnonymizeSearch.value.trim()) return;
        if (!confirm(`Anonymiser définitivement l'utilisateur "${rgpdAnonymizeSearch.value}" ? Cette action est irréversible.`)) return;
        try {
          await adminService.anonymizeUser(rgpdAnonymizeSearch.value.trim());
          func.showToastSuccess('Utilisateur anonymisé');
          rgpdAnonymizeSearch.value = '';
          loadUsers();
          loadStats();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const confirmDeletion = async (userId: string) => {
        if (!confirm('Confirmer la suppression définitive ? Cette action est irréversible.')) return;
        try {
          await adminService.confirmDeletion(userId);
          func.showToastSuccess('Compte supprimé');
          loadRgpdData();
          loadStats();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const cancelDeletion = async (userId: string) => {
        try {
          await adminService.cancelDeletion(userId);
          func.showToastSuccess('Demande annulée');
          loadRgpdData();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      // === Modération Posts ===
      const loadModPosts = async () => {
        try {
          const [postsData, statsData] = await Promise.all([
            adminService.getAdminPosts({ page: modPostsPage.value, search: modPostSearch.value, type: modPostType.value }),
            adminService.getPostStats()
          ]);
          modPosts.value = postsData.posts;
          modPostsPagination.value = postsData.pagination;
          postStats.value = statsData;
        } catch (e) { /* ignore */ }
      };

      const deleteModPost = async (postId: string) => {
        const reason = prompt('Raison de la suppression (optionnel):');
        if (reason === null) return;
        try {
          await adminService.adminDeletePost(postId, reason || undefined);
          func.showToastSuccess('Post supprimé');
          loadModPosts();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      // === Audit ===
      const loadAuditLogs = async () => {
        try {
          const [logsData, statsData] = await Promise.all([
            adminService.getAuditLogs({ page: auditPage.value, targetType: auditFilter.value }),
            adminService.getAuditStats()
          ]);
          auditLogs.value = logsData.logs;
          auditPagination.value = logsData.pagination;
          auditStats.value = statsData;
        } catch (e) { /* ignore */ }
      };

      const getInitial = (username: string) => {
        return username ? username.charAt(0).toUpperCase() : '?';
      };

      // === K-pop ===
      const loadKpopData = async () => {
        try {
          const [groups, albums] = await Promise.all([
            groupService.getGroups({ limit: 2000 }),
            albumService.getAlbums({ limit: 2000 })
          ]);
          kpopGroups.value = groups;
          kpopAlbums.value = albums;
        } catch (e) { /* ignore */ }
      };

      let kpopGroupTimer: any = null;
      const debouncedSearchGroups = () => {
        clearTimeout(kpopGroupTimer);
        kpopGroupTimer = setTimeout(async () => {
          if (kpopGroupSearch.value.trim()) {
            kpopGroups.value = await groupService.searchGroups(kpopGroupSearch.value, true);
          } else {
            kpopGroups.value = await groupService.getGroups({ limit: 2000 });
          }
        }, 300);
      };

      let kpopAlbumTimer: any = null;
      const debouncedSearchAlbums = () => {
        clearTimeout(kpopAlbumTimer);
        kpopAlbumTimer = setTimeout(async () => {
          if (kpopAlbumSearch.value.trim()) {
            kpopAlbums.value = await albumService.searchAlbums(kpopAlbumSearch.value, 2000);
          } else {
            kpopAlbums.value = await albumService.getAlbums({ limit: 2000 });
          }
        }, 300);
      };

      const openGroupForm = (group?: any) => {
        if (group) {
          editingGroup.value = group;
          groupForm.value = {
            name: group.name,
            image: group.image || '',
            membersRaw: (group.members || []).join(', ')
          };
        } else {
          editingGroup.value = null;
          groupForm.value = { name: '', image: '', membersRaw: '' };
        }
        showGroupForm.value = true;
      };

      const openAlbumForm = (album?: any) => {
        if (album) {
          editingAlbum.value = album;
          albumForm.value = {
            name: album.name,
            group: album.group?._id || album.group || '',
            type: album.type || '',
            releaseDate: album.releaseDate ? album.releaseDate.substring(0, 10) : '',
            coverImage: album.coverImage || ''
          };
        } else {
          editingAlbum.value = null;
          albumForm.value = { name: '', group: '', type: '', releaseDate: '', coverImage: '' };
        }
        showAlbumForm.value = true;
      };

      const submitGroup = async () => {
        const payload: any = { name: groupForm.value.name };
        if (groupForm.value.image) payload.image = groupForm.value.image;
        if (groupForm.value.membersRaw.trim()) {
          payload.members = groupForm.value.membersRaw.split(',').map((m: string) => m.trim()).filter(Boolean);
        }
        try {
          if (editingGroup.value) {
            await groupService.updateGroup(editingGroup.value._id, payload);
            func.showToastSuccess('Groupe modifié');
          } else {
            await groupService.createGroup(payload);
            func.showToastSuccess('Groupe créé');
          }
          showGroupForm.value = false;
          loadKpopData();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const submitAlbum = async () => {
        const payload: any = { name: albumForm.value.name };
        if (albumForm.value.group) payload.group = albumForm.value.group;
        if (albumForm.value.type) payload.type = albumForm.value.type;
        if (albumForm.value.releaseDate) payload.releaseDate = albumForm.value.releaseDate;
        if (albumForm.value.coverImage) payload.coverImage = albumForm.value.coverImage;
        try {
          if (editingAlbum.value) {
            await albumService.updateAlbum(editingAlbum.value._id, payload);
            func.showToastSuccess('Album modifié');
          } else {
            await albumService.createAlbum(payload);
            func.showToastSuccess('Album créé');
          }
          showAlbumForm.value = false;
          loadKpopData();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Supprimer ce groupe définitivement ?')) return;
        try {
          await groupService.deleteGroup(groupId);
          func.showToastSuccess('Groupe supprimé');
          loadKpopData();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const handleDeleteAlbum = async (albumId: string) => {
        if (!confirm('Supprimer cet album définitivement ?')) return;
        try {
          await albumService.deleteAlbum(albumId);
          func.showToastSuccess('Album supprimé');
          loadKpopData();
        } catch (e: any) {
          func.showToastError(e?.response?.data?.message || 'Erreur');
        }
      };

      const viewGroupFollowers = async (group: any) => {
        followersGroupName.value = group.name;
        try {
          const data = await groupService.getFollowers(group._id, 1, 50);
          groupFollowers.value = data.followers || data || [];
        } catch (e) {
          groupFollowers.value = [];
        }
        showFollowersModal.value = true;
      };

      // === Init ===
      onMounted(async () => {
        try {
          await authentificationService.verifSession();
          await Promise.all([loadStats(), loadProductStats(), loadReports(), loadUsers(), loadProducts(), loadVerifications()]);
        } catch (e) {
          router.push({ name: 'login' });
        }
      });

      return {
        apiUrl,
        currentTab,
        stats,
        productStats,
        tabs,
        typeLabels,
        reports,
        reportFilter,
        pendingReportsCount,
        users,
        userSearch,
        userRoleFilter,
        usersPage,
        usersPagination,
        products,
        productSearch,
        productStatusFilter,
        productTypeFilter,
        productsPage,
        productsPagination,
        verifications,
        rgpdUserSearch,
        rgpdAnonymizeSearch,
        deletionRequests,
        rgpdStats,
        reasonLabels,
        statusLabels,
        formatDate,
        productStatusClass,
        productStatusLabel,
        switchTab,
        getInitial,
        loadReports,
        loadUsers,
        loadProducts,
        debouncedLoadUsers,
        debouncedLoadProducts,
        handleReport,
        toggleUserStatus,
        changeUserRole,
        deleteProduct,
        approveVerif,
        rejectVerif,
        exportUserData,
        anonymizeUser,
        confirmDeletion,
        cancelDeletion,
        modPosts,
        modPostSearch,
        modPostType,
        modPostsPage,
        modPostsPagination,
        postStats,
        loadModPosts,
        deleteModPost,
        auditLogs,
        auditFilter,
        auditPage,
        auditPagination,
        auditStats,
        loadAuditLogs,
        kpopSubTab,
        kpopGroups,
        kpopAlbums,
        kpopGroupSearch,
        kpopAlbumSearch,
        showGroupForm,
        showAlbumForm,
        editingGroup,
        editingAlbum,
        groupForm,
        albumForm,
        debouncedSearchGroups,
        debouncedSearchAlbums,
        openGroupForm,
        openAlbumForm,
        submitGroup,
        submitAlbum,
        handleDeleteGroup,
        handleDeleteAlbum,
        viewGroupFollowers,
        showFollowersModal,
        groupFollowers,
        followersGroupName,
      };
    },
  });
</script>

<style lang="scss" scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}

.admin__header {
  margin-bottom: var(--space-xl);
}

.admin__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  i { color: var(--accent-pink); }
}

// === Stats ===
.admin__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.admin__stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);

  > i {
    font-size: 1.8rem;
    color: var(--accent-pink);
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 45, 120, 0.08);
    border-radius: var(--radius-md);
  }

  &--warning > i {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
  }

  &--success > i {
    color: #16a34a;
    background: rgba(34, 197, 94, 0.08);
  }

  &--danger > i {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
  }
}

.admin__stat-value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.admin__stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

// === Tabs ===
.admin__tabs {
  display: flex;
  gap: var(--space-xs);
  border-bottom: 2px solid var(--surface-border);
  margin-bottom: var(--space-lg);
  overflow-x: auto;
}

.admin__tab {
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;

  &:hover { color: var(--text-primary); }

  &.active {
    color: var(--accent-pink);
    border-bottom-color: var(--accent-pink);
  }
}

.admin__tab-badge {
  background: var(--danger);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-weight: 700;
}

// === Panel ===
.admin__panel {
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
}

.admin__panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-sm);

  h2 {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.admin__filters {
  display: flex;
  gap: var(--space-sm);
  align-items: center;

  select, input {
    padding: 8px 12px;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    color: var(--text-primary);
    background: var(--bg-primary);

    &:focus {
      outline: none;
      border-color: var(--accent-pink);
    }
  }
}

.admin__search-input {
  min-width: 180px;
}

.admin__empty {
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-muted);

  i { font-size: 2.5rem; display: block; margin-bottom: var(--space-sm); }
  p { margin: 0; font-size: var(--font-size-sm); }
}

// === Table ===
.admin__table-wrapper {
  overflow-x: auto;
}

.admin__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th, td {
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid var(--surface-border);
  }

  th {
    font-weight: 600;
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    color: var(--text-primary);
  }

  tbody tr:hover {
    background: var(--surface-hover);
  }
}

.admin__user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 500;
}

.admin__avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.admin__avatar-letter {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--accent-gradient);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin__verified {
  color: var(--accent-pink);
  font-size: 12px;
}

.admin__badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--surface-hover);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);

  &--info { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
  &--neutral { background: var(--surface-hover); color: var(--text-secondary); }
}

.admin__content-preview {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  max-width: 250px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--surface-border);

  button {
    padding: 6px 10px;
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:hover:not(:disabled) { border-color: var(--accent-pink); color: var(--accent-pink); }
  }

  span {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

.admin__status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;

  &--pending { background: rgba(245, 158, 11, 0.1); color: #d97706; }
  &--reviewed { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
  &--resolved, &--active { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
  &--rejected, &--suspended { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
  &--deleted { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
}

.admin__inline-select {
  padding: 4px 8px;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.admin__actions {
  display: flex;
  gap: 4px;
}

.admin__action-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all var(--transition-fast);

  &--success {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
    &:hover { background: rgba(34, 197, 94, 0.2); }
  }

  &--danger {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    &:hover { background: rgba(239, 68, 68, 0.2); }
  }
}

.admin__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  margin-top: var(--space-lg);
  border-top: 1px solid var(--surface-border);

  span {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  button {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--surface-border);
    background: var(--bg-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
    transition: all var(--transition-fast);

    &:hover:not(:disabled) {
      border-color: var(--accent-pink);
      color: var(--accent-pink);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 768px) {
  .admin { padding: var(--space-md); }
  .admin__stats { grid-template-columns: 1fr 1fr; }
  .admin__panel { padding: var(--space-md); }
  .admin__panel-header { flex-direction: column; align-items: flex-start; }
  .admin__filters { width: 100%; }
  .admin__search-input { width: 100%; min-width: auto; }
  .admin__overview-grid { grid-template-columns: 1fr; }
}

// === Overview ===
.admin__overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.admin__overview-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);

  h3 {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    i { color: var(--accent-pink); }
  }

  &--highlight {
    background: linear-gradient(135deg, rgba(255, 45, 120, 0.05), rgba(139, 92, 246, 0.05));
    border-color: rgba(255, 45, 120, 0.2);
  }
}

.admin__overview-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin__overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
}

.admin__overview-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.admin__overview-value {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-primary);

  &--danger { color: var(--danger); }
  &--success { color: #16a34a; }
}

.admin__revenue {
  text-align: center;
  padding: var(--space-lg) 0;
}

.admin__revenue-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--accent-pink);
  margin-bottom: var(--space-xs);
}

.admin__revenue-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

// === Products ===
.admin__product-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 500;
}

.admin__product-img {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.admin__price {
  font-weight: 600;
  color: var(--text-primary);
}

// === RGPD ===
.admin__rgpd-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.admin__rgpd-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);

  h3 {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--space-xs);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    i { color: var(--accent-pink); }
  }

  > p {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin: 0 0 var(--space-md);
  }
}

.admin__rgpd-action {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.admin__rgpd-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.admin__rgpd-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.admin__text-muted {
  color: var(--text-muted);
  font-size: var(--font-size-xs);
}

.admin__btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
  transition: all var(--transition-fast);

  &--primary {
    background: var(--accent-pink);
    color: white;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &--danger {
    background: var(--danger);
    color: white;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.admin__sub-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.admin__sub-tab {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &--active {
    background: var(--accent-pink);
    color: white;
    border-color: var(--accent-pink);
  }
}

.admin__toolbar {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  align-items: center;
}

.admin__search-input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.admin__kpop-thumb {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.admin__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.admin__modal {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  width: 100%;
  max-width: 480px;

  h3 {
    margin-bottom: var(--space-lg);
    color: var(--text-primary);
  }
}

.admin__form-group {
  margin-bottom: var(--space-md);

  label {
    display: block;
    margin-bottom: var(--space-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.admin__input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.admin__modal-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

.admin__followers-list {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}

.admin__follower-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }
}
</style>

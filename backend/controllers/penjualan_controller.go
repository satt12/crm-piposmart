package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"piposmart-backend/config"
	"piposmart-backend/models"
)

// GET /api/pipo/penjualan
func GetPenjualan(c *gin.Context) {
	var listPenjualan []models.Penjualan

	if err := config.DB.Order("tanggal DESC").Find(&listPenjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, listPenjualan)
}

// POST /api/pipo/penjualan
func CreatePenjualan(c *gin.Context) {
	type CreateInput struct {
		TanggalInput     string  `json:"tanggalInput"`
		SumberData       string  `json:"sumberData"`
		PicNasabah       string  `json:"picNasabah"`
		KodeOwner        string  `json:"kodeOwner"`
		NamaOwner        string  `json:"namaOwner"`
		Brand            string  `json:"brand"`
		NamaOutlet       string  `json:"namaOutlet"`
		HpOwner          string  `json:"hpOwner"`
		Status           string  `json:"status"`
		Membership       string  `json:"membership"`
		TargetPaket      string  `json:"targetPaket"`
		TargetNominal    float64 `json:"targetNominal"`
		NominalAktual    float64 `json:"nominalAktual"`
		TanggalTraining  string  `json:"tanggalTraining"`
		StatusTraining   string  `json:"statusTraining"`
		TanggalRealisasi string  `json:"tanggalRealisasi"`
		BuktiTransfer    string  `json:"buktiTransfer"`
	}

	var input CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Payload JSON tidak valid: " + err.Error()})
		return
	}

	waktuTransaksi := time.Now()
	if input.TanggalInput != "" {
		if t, err := time.Parse("2006-01-02", input.TanggalInput); err == nil {
			waktuTransaksi = t
		}
	}

	var tTraining *time.Time
	if input.TanggalTraining != "" {
		if t, err := time.Parse("2006-01-02", input.TanggalTraining); err == nil {
			tTraining = &t
		}
	}

	var tRealisasi *time.Time
	if input.TanggalRealisasi != "" {
		if t, err := time.Parse("2006-01-02", input.TanggalRealisasi); err == nil {
			tRealisasi = &t
		}
	}

	newPenjualan := models.Penjualan{
		Tanggal:          waktuTransaksi,
		PicTeam:          input.PicNasabah,
		KodeOwner:        input.KodeOwner,
		NamaOwner:        input.NamaOwner,
		NamaBrand:        input.Brand,
		NamaOutlet:       input.NamaOutlet,
		HpOwner:          input.HpOwner,
		SumberData:       input.SumberData,
		Status:           input.Status,
		Membership:       input.Membership,
		TargetPaket:      input.TargetPaket,
		TargetNominal:    input.TargetNominal,
		PaketAktual:      input.TargetPaket, 
		TotalPenjualan:   input.NominalAktual,
		TanggalTraining:  tTraining,
		StatusTraining:   input.StatusTraining,
		TanggalRealisasi: tRealisasi,
		BuktiTransfer:    input.BuktiTransfer,
	}

	if err := config.DB.Create(&newPenjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menyimpan ke database SQL: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Data pipeline CRM berhasil disimpan!", "data": newPenjualan})
}

// PUT /api/pipo/penjualan/:id
func UpdatePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	if err := config.DB.First(&penjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data tidak ditemukan"})
		return
	}

	type UpdateInput struct {
		TanggalInput     *string  `json:"tanggalInput"`
		SumberData       *string  `json:"sumberData"`
		PicNasabah       *string  `json:"picNasabah"`
		KodeOwner        *string  `json:"kodeOwner"`
		NamaOwner        *string  `json:"namaOwner"`
		Brand            *string  `json:"brand"`
		NamaOutlet       *string  `json:"namaOutlet"`
		HpOwner          *string  `json:"hpOwner"`
		Status           *string  `json:"status"`
		Membership       *string  `json:"membership"`
		TargetPaket      *string  `json:"targetPaket"`
		TargetNominal    *float64 `json:"targetNominal"`
		NominalAktual    *float64 `json:"nominalAktual"`
		TanggalTraining  *string  `json:"tanggalTraining"`
		StatusTraining   *string  `json:"statusTraining"`
		TanggalRealisasi *string  `json:"tanggalRealisasi"`
		BuktiTransfer    *string  `json:"buktiTransfer"`
	}

	var input UpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	updates := map[string]interface{}{}

	if input.TanggalInput != nil && *input.TanggalInput != "" {
		if t, err := time.Parse("2006-01-02", *input.TanggalInput); err == nil { updates["tanggal"] = t }
	}
	if input.PicNasabah != nil { updates["pic_team"] = *input.PicNasabah }
	if input.KodeOwner != nil { updates["kode_owner"] = *input.KodeOwner }
	if input.NamaOwner != nil { updates["nama_owner"] = *input.NamaOwner }
	if input.Brand != nil { updates["nama_brand"] = *input.Brand }
	if input.NamaOutlet != nil { updates["nama_outlet"] = *input.NamaOutlet }
	if input.HpOwner != nil { updates["hp_owner"] = *input.HpOwner }
	if input.SumberData != nil { updates["sumber_data"] = *input.SumberData }
	if input.Status != nil { updates["status"] = *input.Status }
	if input.Membership != nil { updates["membership"] = *input.Membership }
	if input.TargetPaket != nil { updates["target_paket"] = *input.TargetPaket }
	if input.TargetNominal != nil { updates["target_nominal"] = *input.TargetNominal }
	if input.NominalAktual != nil { 
		updates["total_penjualan"] = *input.NominalAktual 
	}
	if input.StatusTraining != nil { updates["status_training"] = *input.StatusTraining }
	if input.BuktiTransfer != nil { updates["bukti_transfer"] = *input.BuktiTransfer }

	if input.TanggalTraining != nil {
		if *input.TanggalTraining != "" {
			if t, err := time.Parse("2006-01-02", *input.TanggalTraining); err == nil { updates["tanggal_training"] = &t }
		} else {
			updates["tanggal_training"] = nil
		}
	}
	if input.TanggalRealisasi != nil {
		if *input.TanggalRealisasi != "" {
			if t, err := time.Parse("2006-01-02", *input.TanggalRealisasi); err == nil { updates["tanggal_realisasi"] = &t }
		} else {
			updates["tanggal_realisasi"] = nil
		}
	}

	if err := config.DB.Model(&penjualan).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Record pipeline CRM berhasil diperbarui", "data": penjualan})
}

// DELETE /api/pipo/penjualan/:id
func DeletePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	if err := config.DB.First(&penjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data tidak ditemukan"})
		return
	}

	if err := config.DB.Delete(&penjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menghapus data dari database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Record pipeline crm berhasil dihapus secara permanen"})
}
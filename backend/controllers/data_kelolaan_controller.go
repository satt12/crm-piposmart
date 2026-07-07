package controllers

import (
	"net/http"
	"time"
	"piposmart-backend/config"
	"piposmart-backend/models"

	"github.com/gin-gonic/gin"
)

// Struct untuk menangkap input JSON camelCase dari form Next.js
type CreateDataKelolaanInput struct {
	TanggalFu   string `json:"tanggalFu" binding:"required"`
	Bulan       string `json:"bulan" binding:"required"`
	StatusAkun  string `json:"statusAkun" binding:"required"`
	Pic         string `json:"pic"` // 🛠️ FIX: ditambahkan supaya PIC ikut ke-bind dari payload frontend
	NamaOwner   string `json:"namaOwner" binding:"required"`
	Brand       string `json:"brand" binding:"required"`
	HpOwner     string `json:"hpOwner" binding:"required"`
	ExpiredDate string `json:"expiredDate"`
	Score       string `json:"score"`
	CallStatus  string `json:"callStatus"`
	ChatStatus  string `json:"chatStatus"`
	Sumber      string `json:"sumber"`
	Noted       string `json:"noted"`
}

// 🌟 Struct Baru khusus untuk Update (menghilangkan binding:required agar opsional jika ada field kosong)
type UpdateDataKelolaanInput struct {
	TanggalFu   string `json:"tanggalFu"`
	Bulan       string `json:"bulan"`
	StatusAkun  string `json:"statusAkun"`
	Pic         string `json:"pic"` // 🛠️ FIX: ditambahkan supaya PIC ikut ter-update
	NamaOwner   string `json:"namaOwner"`
	Brand       string `json:"brand"`
	HpOwner     string `json:"hpOwner"`
	ExpiredDate string `json:"expiredDate"`
	Score       string `json:"score"`
	CallStatus  string `json:"callStatus"`
	ChatStatus  string `json:"chatStatus"`
	Sumber      string `json:"sumber"`
	Noted       string `json:"noted"`
}

// CreateDataKelolaan menyimpan record baru dari Next.js ke database
func CreateDataKelolaan(c *gin.Context) {
	var input CreateDataKelolaanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input salah: " + err.Error()})
		return
	}

	dataBaru := models.DataKelolaan{
		TanggalFu:   input.TanggalFu,
		Bulan:       input.Bulan,
		StatusAkun:  input.StatusAkun,
		Pic:         input.Pic, // 🛠️ FIX
		NamaOwner:   input.NamaOwner,
		Brand:       input.Brand,
		HpOwner:     input.HpOwner,
		ExpiredDate: input.ExpiredDate,
		Score:       input.Score,
		CallStatus:  input.CallStatus,
		ChatStatus:  input.ChatStatus,
		Sumber:      input.Sumber,
		Noted:       input.Noted,
		CreatedAt:   time.Now(),
	}

	if err := config.DB.Create(&dataBaru).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan ke database: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Sakti! Data Kelolaan berhasil disimpan!", "data": dataBaru})
}

// GetDataKelolaan mengambil seluruh list data kelolaan
func GetDataKelolaan(c *gin.Context) {
	var list []models.DataKelolaan
	if err := config.DB.Order("id desc").Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kelolaan"})
		return
	}
	c.JSON(http.StatusOK, list)
}

// ExportDataKelolaan meng-export data kelolaan ke file Excel
func ExportDataKelolaan(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Fitur export kelolaan menyusul"})
}

// 🌟 HAndler Baru 1: UpdateDataKelolaan (PUT /api/kelolaan/update/:id)
func UpdateDataKelolaan(c *gin.Context) {
	id := c.Param("id")
	var dataKelolaan models.DataKelolaan

	// 1. Cari datanya dulu di PostgreSQL berdasarkan ID
	if err := config.DB.First(&dataKelolaan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data Kelolaan tidak ditemukan!"})
		return
	}

	// 2. Bind JSON perubahan dari frontend Next.js
	var input UpdateDataKelolaanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input edit salah: " + err.Error()})
		return
	}

	// 3. Eksekusi update field ke database via GORM Updates
	updatedFields := models.DataKelolaan{
		TanggalFu:   input.TanggalFu,
		Bulan:       input.Bulan,
		StatusAkun:  input.StatusAkun,
		Pic:         input.Pic, // 🛠️ FIX
		NamaOwner:   input.NamaOwner,
		Brand:       input.Brand,
		HpOwner:     input.HpOwner,
		ExpiredDate: input.ExpiredDate,
		Score:       input.Score,
		CallStatus:  input.CallStatus,
		ChatStatus:  input.ChatStatus,
		Sumber:      input.Sumber,
		Noted:       input.Noted,
	}

	if err := config.DB.Model(&dataKelolaan).Updates(updatedFields).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data Kelolaan berhasil diperbarui!", "data": dataKelolaan})
}

// 🌟 Handler Baru 2: DeleteDataKelolaan (DELETE /api/kelolaan/delete/:id)
func DeleteDataKelolaan(c *gin.Context) {
	id := c.Param("id")
	var dataKelolaan models.DataKelolaan

	// 1. Cek apakah record data tersebut eksis di database
	if err := config.DB.First(&dataKelolaan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data Kelolaan tidak ditemukan atau sudah dihapus!"})
		return
	}

	// 2. Eksekusi Hapus Permanen (Hard Delete)
	if err := config.DB.Delete(&dataKelolaan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data dari database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data Kelolaan berhasil dihapus permanen!"})
}
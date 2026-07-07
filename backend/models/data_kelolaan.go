package models

import "time"

// DataKelolaan adalah struct tunggal GORM untuk memetakan tabel data_kelolaans di PostgreSQL
type DataKelolaan struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TanggalFu   string    `json:"tanggalFu"`
	Bulan       string    `json:"bulan"`
	StatusAkun  string    `json:"statusAkun"`
	Pic         string    `gorm:"column:pic" json:"pic"` // 🛠️ FIX: field ini sebelumnya tidak ada, jadi PIC tidak pernah tersimpan
	NamaOwner   string    `json:"namaOwner"`
	Brand       string    `json:"brand"`
	HpOwner     string    `json:"hpOwner"`
	ExpiredDate string    `json:"expiredDate"`
	Score       string    `json:"score"`
	CallStatus  string    `json:"callStatus"`
	ChatStatus  string    `json:"chatStatus"`
	Sumber      string    `json:"sumber"`
	Noted       string    `json:"noted"`
	CreatedAt   time.Time `json:"createdAt"`
}
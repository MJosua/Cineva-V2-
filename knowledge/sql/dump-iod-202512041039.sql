-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: 172.16.32.20    Database: iod
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `action_logger`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `action_logger` (
  `id` varchar(100) DEFAULT NULL,
  `time_event` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `address`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `address_id` int NOT NULL,
  `street` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complex` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rt` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rw` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `community` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `regency` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `approval`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval` (
  `id` int NOT NULL AUTO_INCREMENT,
  `typ` int NOT NULL COMMENT '1=SO',
  `identifier` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approval_level` int NOT NULL,
  `flag` int DEFAULT '0' COMMENT '0=default;1=approved;2=rejected',
  `employee_id` int DEFAULT NULL,
  `approve_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`,`typ`,`identifier`,`approval_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `communication`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `communication` (
  `person_id` int NOT NULL,
  `nr` int NOT NULL,
  `typ` int DEFAULT NULL,
  `data` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`person_id`,`nr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cstm_form`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cstm_form` (
  `column_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_3` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_4` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_5` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_6` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_7` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_8` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_9` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_10` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_11` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `column_12` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_id` bigint NOT NULL AUTO_INCREMENT,
  `country_id` int DEFAULT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_id` int DEFAULT NULL,
  `submit_date` date DEFAULT NULL,
  `file_path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`attachment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76501531 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_aop`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_aop` (
  `aop_id` int NOT NULL,
  `company_id` int NOT NULL,
  `client_id` int NOT NULL,
  `year` int NOT NULL,
  `product_id` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `last_approval_date` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `change_date` date DEFAULT NULL,
  `cif_price` decimal(6,2) DEFAULT NULL,
  `aop_price` decimal(6,2) DEFAULT NULL,
  `discount` decimal(4,2) DEFAULT NULL,
  `tp1` decimal(4,2) DEFAULT NULL,
  `tp2` decimal(4,2) DEFAULT NULL,
  `tp3` decimal(4,2) DEFAULT NULL,
  `mfund` decimal(4,2) DEFAULT NULL,
  `locked` int DEFAULT NULL,
  `locked_by` int DEFAULT NULL,
  `locked_date` datetime DEFAULT NULL,
  `aop_desc` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`aop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_aop_2101`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_aop_2101` (
  `aop_id` int NOT NULL,
  `company_id` int NOT NULL,
  `client_id` int NOT NULL,
  `year` int NOT NULL,
  `product_id` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `last_approval_date` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `change_date` date DEFAULT NULL,
  `cif_price` decimal(6,2) DEFAULT NULL,
  `aop_price` decimal(6,2) DEFAULT NULL,
  `discount` decimal(4,2) DEFAULT NULL,
  `tp1` decimal(4,2) DEFAULT NULL,
  `tp2` decimal(4,2) DEFAULT NULL,
  `tp3` decimal(4,2) DEFAULT NULL,
  `mfund` decimal(4,2) DEFAULT NULL,
  `locked` int DEFAULT NULL,
  `locked_by` int DEFAULT NULL,
  `locked_date` datetime DEFAULT NULL,
  `aop_desc` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`aop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_aop_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_aop_detail` (
  `aop_id` int NOT NULL,
  `month` int NOT NULL,
  `version_nr` int NOT NULL DEFAULT '0' COMMENT 'version_nr: \r\n0 = the current version\r\n1 = the last previous version\r\n2\r\n3.\r\nBy update a new version first add 1 to all the eisting version before insert the current actual version',
  `value` int DEFAULT NULL,
  `volume` decimal(15,5) DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL COMMENT 'user id who made the las change if the volume is different',
  `change_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `aop_detail_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_by` int DEFAULT NULL,
  `approved_status` int DEFAULT NULL,
  PRIMARY KEY (`aop_id`,`month`,`version_nr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_aop_detail_2101`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_aop_detail_2101` (
  `aop_id` int NOT NULL,
  `month` int NOT NULL,
  `version_nr` int NOT NULL,
  `value` int DEFAULT NULL,
  `volume` decimal(15,5) DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `change_date` datetime DEFAULT NULL,
  `aop_detail_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_by` int DEFAULT NULL,
  `approved_status` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_cwo`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_cwo` (
  `company_id` int NOT NULL,
  `country` int NOT NULL,
  `client` int DEFAULT NULL,
  `shipto` int DEFAULT NULL,
  `week_delv` int NOT NULL,
  `year_delv` int NOT NULL,
  `so_id` bigint NOT NULL,
  `product_code` int NOT NULL,
  `qty` int DEFAULT NULL,
  `close` tinyint NOT NULL DEFAULT '0',
  `division_id` int DEFAULT '1',
  PRIMARY KEY (`company_id`,`country`,`week_delv`,`year_delv`,`so_id`,`product_code`),
  KEY `dat_cwo_company_id_IDX` (`company_id`,`so_id`,`product_code`) USING BTREE,
  KEY `idx_dat_cwo_so_prod_close` (`so_id`,`product_code`,`close`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_cwo_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_cwo_detail` (
  `company_id` int NOT NULL,
  `so_id` bigint NOT NULL,
  `product_code` int NOT NULL,
  `week` int NOT NULL,
  `year` int NOT NULL,
  `value` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`so_id`,`product_code`,`week`,`year`),
  KEY `dat_cwo_detail_company_id_IDX` (`company_id`,`so_id`,`product_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_machine_capacity`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_machine_capacity` (
  `company_id` int NOT NULL,
  `factory_id` int NOT NULL,
  `machine_id` int NOT NULL,
  `year` int NOT NULL,
  `week` int NOT NULL,
  `remaining_cap` int DEFAULT NULL,
  `order_cap` int DEFAULT NULL,
  `stuffing_cap` int DEFAULT NULL,
  `last_update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`company_id`,`factory_id`,`machine_id`,`year`,`week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_operational_calendar`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_operational_calendar` (
  `company_id` int NOT NULL,
  `opcal_id` int NOT NULL,
  `factory_id` int NOT NULL,
  `year` int NOT NULL,
  `op_month` int DEFAULT NULL,
  `product_type_id` int NOT NULL,
  `week` int NOT NULL,
  `delivery_week` smallint DEFAULT '5' COMMENT 'This is the minimal weeks ahead for delivery.',
  `capacity` int NOT NULL,
  `plan` int DEFAULT NULL,
  `actual` int DEFAULT NULL,
  `holiday_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`opcal_id`,`factory_id`,`year`,`product_type_id`),
  KEY `dat_operational_calendar_opcal_id_IDX` (`opcal_id`) USING BTREE,
  KEY `dat_operational_calendar_opcal_id_company_id_idx` (`opcal_id`,`company_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_operational_calendar_bak`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_operational_calendar_bak` (
  `company_id` int NOT NULL,
  `opcal_id` int NOT NULL,
  `factory_id` int NOT NULL,
  `year` int NOT NULL,
  `op_month` int DEFAULT NULL,
  `product_type_id` int NOT NULL,
  `week` int NOT NULL,
  `capacity` int NOT NULL,
  `plan` int DEFAULT NULL,
  `actual` int DEFAULT NULL,
  `holiday_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`opcal_id`,`factory_id`,`year`,`product_type_id`),
  KEY `dat_operational_calendar_opcal_id_IDX` (`opcal_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_posm`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_posm` (
  `posm_id` bigint NOT NULL,
  `invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `delv_date` date DEFAULT NULL,
  `sku_id` int NOT NULL,
  `product_sku` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uom` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `type` int DEFAULT NULL COMMENT '1. POSM;\r\n2. Samples;\r\n3. Part of;\r\n4. Free Goods;',
  `declare` tinyint DEFAULT NULL,
  `price` decimal(12,4) DEFAULT NULL,
  `nett` float DEFAULT NULL,
  `gross` float DEFAULT NULL,
  PRIMARY KEY (`posm_id`,`invoice_id`,`cont_id`,`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dat_wbs_anp`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_wbs_anp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `docno` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `budget` decimal(16,4) DEFAULT NULL,
  `product_code` int DEFAULT NULL,
  `product_sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(16,4) DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `activity_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usage` int DEFAULT NULL,
  `cond_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dat_wbs_anp_company_id_IDX` (`company_id`,`docno`,`product_code`,`is_deleted`) USING BTREE,
  KEY `idx_dupl_check` (`company_id`,`docno`,`product_code`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=470506 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_logger`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_logger` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `uid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tokek` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tokek_bangke` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_attempt` int DEFAULT '0',
  `login_trial_time` timestamp NULL DEFAULT NULL,
  `event_type` int NOT NULL COMMENT '1. auth, 2. notify order',
  `is_notified` tinyint DEFAULT '0',
  `order_id` bigint DEFAULT NULL,
  UNIQUE KEY `event_logger_un` (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `export_so`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_so` (
  `so_id` int NOT NULL,
  `client_id` int NOT NULL,
  `order_type` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_organization` bigint DEFAULT NULL,
  `distribution_channel` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `division` bigint DEFAULT NULL,
  `sold_to_party` int DEFAULT NULL,
  `ship_to_party` int DEFAULT NULL,
  `po_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `payment_terms` varchar(0) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incoterms` varchar(0) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harbour_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item` bigint NOT NULL,
  `product_code` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `un` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plnt` bigint DEFAULT NULL,
  `storage_location` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiving_plnt` bigint DEFAULT NULL,
  `completion_note` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factory` varchar(0) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipment_port` varchar(0) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination_port` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `final_destination` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_period` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trade_promotion` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `week_inv` int DEFAULT NULL,
  `marks_number` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposal_anp` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`so_id`,`client_id`,`item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_banner`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_banner` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `starting_date` datetime DEFAULT NULL,
  `ending_date` datetime DEFAULT NULL,
  `img_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption_remarks` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_remarks` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `m_banner_FK` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_cart`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_cart` (
  `cart_id` bigint NOT NULL,
  `company_id` int DEFAULT NULL,
  `delv_week` int NOT NULL,
  `delv_week_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_buyer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `port_shipment` int DEFAULT NULL,
  `ship_to` int DEFAULT NULL,
  `po_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `final_dest` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delv_year` int DEFAULT NULL,
  `id_year` int DEFAULT NULL,
  `stuffing_date` date DEFAULT NULL,
  `tolling_id` int DEFAULT NULL,
  `bill_to` int DEFAULT NULL,
  `notify1` int DEFAULT NULL,
  `notify2` int DEFAULT NULL,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_cart_dtl`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_cart_dtl` (
  `cart_id` bigint NOT NULL,
  `company_id` int NOT NULL,
  `created_by` int NOT NULL,
  `detail_id` bigint NOT NULL,
  `cont_size` int DEFAULT NULL,
  `cont_qty` int DEFAULT NULL,
  `sku1` int DEFAULT NULL,
  `sku2` int DEFAULT NULL,
  `sku3` int DEFAULT NULL,
  `qty1` int DEFAULT NULL,
  `qty2` int DEFAULT NULL,
  `qty3` int DEFAULT NULL,
  `price1` double DEFAULT NULL,
  `price2` double DEFAULT NULL,
  `price3` int DEFAULT NULL,
  `remarks` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bulk` tinyint DEFAULT NULL,
  `delv_week` int DEFAULT NULL,
  `created_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delv_year` int DEFAULT NULL,
  `id_year` int DEFAULT NULL,
  `custom` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`cart_id`,`company_id`,`created_by`,`detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `max_sku` tinyint DEFAULT NULL,
  `pallet` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `m_config_FK` (`company_id`),
  CONSTRAINT `m_config_FK` FOREIGN KEY (`company_id`) REFERENCES `mst_company` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Digunakan untuk setting tertentu pada distributor.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_config_new`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_config_new` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `conditions` int DEFAULT NULL,
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_contactus`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_contactus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_feedback`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feedback` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `img_url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `m_feedback_FK` (`company_id`),
  CONSTRAINT `m_feedback_FK` FOREIGN KEY (`company_id`) REFERENCES `mst_company` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='untuk menyimpan feedback dari user: \r\nid, \r\nuser_id, \r\ncompany_id, \r\nfeedback, \r\ncreated_date';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_menu_option`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_menu_option` (
  `menu_id` int NOT NULL,
  `type_id` int NOT NULL,
  `menu_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `menu_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_order`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_order` (
  `order_id` bigint NOT NULL,
  `company_id` int DEFAULT NULL,
  `delv_week` int NOT NULL,
  `delv_week_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_buyer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port_shipment` int DEFAULT NULL,
  `po_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `ship_to` int DEFAULT NULL,
  `po_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `final_dest` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delv_year` int DEFAULT NULL,
  `id_year` int DEFAULT NULL,
  `tolling_id` int DEFAULT '0',
  `stuffing_date` date DEFAULT NULL,
  `po_buyer_pcl` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bill_to` int DEFAULT NULL,
  `notify1` int DEFAULT NULL,
  `notify2` int DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `m_order_port_shipment_IDX` (`port_shipment`,`company_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_order_cont`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_order_cont` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint DEFAULT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `etd` date DEFAULT NULL,
  `eta` date DEFAULT NULL,
  `shipping_line` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vessel_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_order_dtl`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_order_dtl` (
  `order_id` bigint NOT NULL,
  `company_id` int NOT NULL,
  `created_by` int NOT NULL,
  `detail_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cont_size` int DEFAULT NULL,
  `cont_qty` int DEFAULT NULL,
  `sku1` int DEFAULT NULL,
  `sku2` int DEFAULT NULL,
  `sku3` int DEFAULT NULL,
  `qty1` int DEFAULT NULL,
  `qty2` int DEFAULT NULL,
  `qty3` int DEFAULT NULL,
  `price1` double DEFAULT NULL,
  `price2` bigint unsigned DEFAULT NULL,
  `price3` int DEFAULT NULL,
  `remarks` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bulk` tinyint DEFAULT NULL,
  `delv_week` int DEFAULT NULL,
  `delv_year` int DEFAULT NULL,
  `id_year` int DEFAULT NULL,
  `custom` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`order_id`,`company_id`,`created_by`,`detail_id`),
  KEY `m_order_dtl_company_id_IDX` (`company_id`) USING BTREE,
  KEY `m_order_dtl_sku1_IDX` (`sku1`) USING BTREE,
  KEY `m_order_dtl_sku2_IDX` (`sku2`) USING BTREE,
  KEY `m_order_dtl_sku3_IDX` (`sku3`) USING BTREE,
  KEY `m_order_dtl_order_id_IDX` (`order_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_order_status`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_order_status` (
  `id` tinyint NOT NULL,
  `status_order` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='status order detail. related to flag:\r\n0.SUBMITTED/WAITING FOR CONFIRMATION 1.PROCEED I2I 99.CANCEL';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_product_link`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_product_link` (
  `product_code` int NOT NULL,
  `order` tinyint NOT NULL,
  `img` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` tinyint DEFAULT NULL COMMENT '1: Active; 2: Deleted',
  `oth_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`product_code`,`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_request_data_change`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_request_data_change` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `req_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_approved` tinyint NOT NULL COMMENT '0=waiting, 1=approved, 9=decline'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='this used by e-order to ask request of changing profile data';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_summary`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_summary` (
  `order_id` bigint NOT NULL,
  `company_id` int DEFAULT NULL,
  `po_buyer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail_id` int NOT NULL,
  `sku` int DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `top_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delv_date` date DEFAULT NULL,
  PRIMARY KEY (`order_id`,`po_buyer`,`detail_id`),
  KEY `m_summary_order_id_IDX` (`order_id`) USING BTREE,
  KEY `m_summary_sku_IDX` (`sku`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='contain raw data of summary order from m_order and m_order_dtl';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `m_user_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `m_user_type` (
  `type_id` tinyint NOT NULL,
  `user_type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_cont_for_dist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_cont_for_dist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `dist_id` int DEFAULT NULL,
  `cont_type` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  `remark` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time_fence` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `map_cont_for_dist_unique` (`company_id`,`dist_id`),
  KEY `map_cont_for_dist_company_id_IDX` (`company_id`,`dist_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=560 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_employee_country`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_employee_country` (
  `company_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `country_id` int NOT NULL,
  `creation_date` date NOT NULL,
  `finish_date` date DEFAULT NULL,
  `descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`employee_id`,`country_id`,`creation_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_employee_superior`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_employee_superior` (
  `employee_id` int NOT NULL,
  `superior_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_fac_for_dist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_fac_for_dist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `dist_id` int DEFAULT NULL,
  `factory_id` int DEFAULT NULL,
  `remark` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_dt` date DEFAULT NULL,
  PRIMARY KEY (`id`,`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=318 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_factory_pic`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_factory_pic` (
  `id` int NOT NULL,
  `factory_id` int DEFAULT NULL,
  `pic_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `remarks` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` int DEFAULT NULL COMMENT '1 = To; 2 = CC',
  `plant_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_item_for_dist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_item_for_dist` (
  `company_id` int NOT NULL,
  `product_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `creation_date` date NOT NULL,
  `finish_date` date DEFAULT NULL,
  `descr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moq` int DEFAULT NULL,
  `moq20` int DEFAULT NULL,
  `sticker` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `truck` int DEFAULT NULL,
  `qty_per_pallet` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`product_id`,`distributor_id`),
  KEY `map_item_for_dist_distributor_id_IDX` (`distributor_id`,`creation_date`,`finish_date`) USING BTREE,
  KEY `idx_map_item_dist_join_filter` (`distributor_id`,`company_id`,`product_id`,`creation_date`,`finish_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_machine_prodtype`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_machine_prodtype` (
  `machine_id` int NOT NULL,
  `product_type_id` int NOT NULL,
  `speed` int NOT NULL,
  `mmp_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  PRIMARY KEY (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_machine_speed`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_machine_speed` (
  `machine_id` int NOT NULL,
  `product_type_id` int NOT NULL,
  `speed` int NOT NULL,
  `active` int DEFAULT NULL,
  `machine_speed_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`machine_id`,`product_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_port_for_dist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_port_for_dist` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `harbour_id` int NOT NULL,
  `incoterm_id` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cifto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `final_dest` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  `descr` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port_link` int DEFAULT NULL,
  KEY `map_port_for_dist_distributor_id_IDX` (`distributor_id`,`harbour_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_product_code`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_product_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int DEFAULT NULL,
  `distributor_id` int DEFAULT NULL,
  `product_code` int DEFAULT NULL,
  `division_id` int DEFAULT NULL,
  `other_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_region_countries`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_region_countries` (
  `region_id` int NOT NULL,
  `country_id` int NOT NULL,
  `active` int DEFAULT NULL,
  `last_change_date` datetime DEFAULT NULL,
  PRIMARY KEY (`region_id`,`country_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_resp_for_dist`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_resp_for_dist` (
  `company_id` int NOT NULL,
  `team_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `creation_date` date NOT NULL,
  `finish_date` date DEFAULT NULL,
  `descr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`team_id`,`distributor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `map_supervisor_staff`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_supervisor_staff` (
  `company_id` int NOT NULL,
  `supervisor_id` int DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  `desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_anp_budget`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_anp_budget` (
  `aba_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `distributor_id` int DEFAULT NULL,
  `budget_year` int DEFAULT NULL,
  `nr` int DEFAULT NULL,
  `initial_amount` decimal(10,2) DEFAULT NULL,
  `remain_amount` decimal(10,2) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `creator_id` int DEFAULT NULL,
  `updater_id` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `last_update_date` date DEFAULT NULL,
  `descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`aba_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_aop_budget`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_aop_budget` (
  `aba_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `distributor_id` int DEFAULT NULL,
  `budget_year` int DEFAULT NULL,
  `nr` int DEFAULT NULL,
  `initial_amount` decimal(10,2) DEFAULT NULL,
  `remain_amount` decimal(10,2) DEFAULT NULL,
  `status` int DEFAULT NULL,
  `creator_id` int DEFAULT NULL,
  `updater_id` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `last_update_date` date DEFAULT NULL,
  `descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`aba_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_approval`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_approval` (
  `company_id` int NOT NULL,
  `approval_id` int NOT NULL,
  `doc_id` int NOT NULL,
  `appr_id` int NOT NULL,
  `flag` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`company_id`,`approval_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_approver`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_approver` (
  `company_id` int NOT NULL,
  `appr_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `delegate_id` int DEFAULT NULL,
  `appr_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`company_id`,`appr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_bom`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_bom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `division_id` int DEFAULT NULL,
  `fg_matcode` int DEFAULT NULL,
  `alternative_bom` int DEFAULT NULL,
  `rm_matcode` int DEFAULT NULL,
  `rm_desc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rm_type` int DEFAULT NULL,
  `uom_id` int DEFAULT NULL,
  `create_by` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `last_update_by` int DEFAULT NULL,
  `last_update_date` date DEFAULT NULL,
  `active` int DEFAULT '1',
  `finish_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mst_bom_unique` (`id`,`division_id`,`fg_matcode`,`rm_matcode`)
) ENGINE=InnoDB AUTO_INCREMENT=2608 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='to store data BOM Component';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_bom_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_bom_type` (
  `id` int NOT NULL,
  `rm_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_brand`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_brand` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `brand_id` int NOT NULL,
  `sbrand_id` int NOT NULL,
  `brand_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sbrand_name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creator_id` int NOT NULL,
  `creation_date` date DEFAULT NULL,
  `brand_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`brand_id`,`sbrand_id`,`division_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_company`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_company` (
  `company_id` int NOT NULL,
  `foreign_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_type_id` int NOT NULL,
  `parent_company_id` int DEFAULT NULL,
  `company_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_company_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_number` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `npwp` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person_id` int DEFAULT NULL,
  `owner_id` int DEFAULT NULL,
  `country_id` int NOT NULL,
  `url_website` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_logo` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `division_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_notice` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `curr_code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dist_channel` tinyint DEFAULT '2' COMMENT '1: Local; 2: Export',
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_company_division`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_company_division` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `division_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `division_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`division_id`,`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_company_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_company_type` (
  `company_type_id` int NOT NULL,
  `company_type_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_type_description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_condition`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_condition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `condition_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_container`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_container` (
  `container_id` int NOT NULL,
  `container_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `container_length` int DEFAULT NULL,
  `container_volume` decimal(5,2) DEFAULT NULL,
  `cbm` decimal(5,2) DEFAULT NULL,
  `max_weight` int DEFAULT NULL,
  `container_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`container_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_country`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_country` (
  `country_id` int NOT NULL,
  `iso_code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_name_id` int DEFAULT NULL,
  `country_desc` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rm_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rm_email` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`country_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_curr_rate`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_curr_rate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `curr_code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `curr_rate` decimal(18,8) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_currency_rates`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_currency_rates` (
  `currency_id` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exchange_date` date NOT NULL,
  `value` decimal(12,4) DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `update_date` date DEFAULT NULL,
  `description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`currency_id`,`exchange_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_department`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_department` (
  `department_id` int NOT NULL,
  `company_id` int NOT NULL,
  `department_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  PRIMARY KEY (`department_id`,`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_disc`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_disc` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `product_code` int NOT NULL,
  `condition_fr` int DEFAULT NULL,
  `condition_to` int DEFAULT NULL,
  `value` decimal(18,4) DEFAULT NULL,
  `disc_in` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`,`company_id`,`distributor_id`,`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_dist_bl`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_dist_bl` (
  `distributor_id` int DEFAULT NULL,
  `foreign_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_doc_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_doc_type` (
  `company_id` int NOT NULL,
  `doc_id` int NOT NULL,
  `doc_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`company_id`,`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_employee`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee` (
  `employee_id` int NOT NULL,
  `company_id` int NOT NULL,
  `person_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `terminate_date` date DEFAULT NULL,
  `adr_id` int DEFAULT NULL,
  `position_id` int DEFAULT NULL,
  `skill_group_id` int DEFAULT NULL,
  `appl_user_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_pswd` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_phone_nr` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_language` int DEFAULT NULL,
  `device_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_employee_position`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee_position` (
  `position_id` int NOT NULL,
  `company_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` int DEFAULT NULL,
  `descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_name_id` int DEFAULT NULL,
  PRIMARY KEY (`position_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_employee_role`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_employee_role` (
  `company_id` int NOT NULL,
  `role_id` int DEFAULT NULL,
  `role_name_id` int DEFAULT NULL,
  `role_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_event_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_event_category` (
  `category_id` int NOT NULL COMMENT 'unique ID',
  `category_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creator_id` int NOT NULL,
  `creation_date` date NOT NULL,
  `inactive_date` date DEFAULT NULL COMMENT 'If inactive will not show for selection',
  `deavtivate_id` int DEFAULT NULL COMMENT 'employee id who deactivated the category'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_factory`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_factory` (
  `company_id` int NOT NULL,
  `factory_id` int NOT NULL,
  `factory_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factory_sname` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_category` int DEFAULT NULL,
  `plant` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harbour_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `factory_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`factory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_flavour`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_flavour` (
  `company_id` int NOT NULL,
  `brand_id` int NOT NULL,
  `flavour_id` int NOT NULL,
  `flavour_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `creation_date` date NOT NULL,
  `last_update_date` date DEFAULT NULL,
  `flavour_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`flavour_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_harbour`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_harbour` (
  `harbour_id` int NOT NULL,
  `harbour_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `harbour_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harbour_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harbour_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `harbour_remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`harbour_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_hour_working_day`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_hour_working_day` (
  `company_id` int NOT NULL,
  `factory_id` int NOT NULL,
  `year` int NOT NULL,
  `day_of_week` int NOT NULL,
  `working_hour` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`factory_id`,`day_of_week`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_incoterm`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_incoterm` (
  `id` int DEFAULT NULL,
  `incoterm_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_location`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_location` (
  `company_id` int NOT NULL,
  `location_id` int NOT NULL,
  `location_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `change_date` datetime DEFAULT NULL,
  `location_desc` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_machine`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_machine` (
  `machine_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `factory_id` int DEFAULT NULL,
  `line` int DEFAULT NULL,
  `product_type_id` int DEFAULT NULL,
  `machine_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `machine_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_machine_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_machine_type` (
  `company_id` int NOT NULL,
  `machine_type_id` int NOT NULL,
  `machine_type_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `machine_type_desc` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`machine_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_op_cal`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_op_cal` (
  `company_id` int DEFAULT NULL,
  `factory_id` int DEFAULT NULL,
  `product_type_id` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `opc_id` int DEFAULT NULL,
  `week` int DEFAULT NULL,
  `day_cnt` int DEFAULT NULL,
  `dow` int DEFAULT NULL,
  `opcal_descr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_opcal_week_month_config`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_opcal_week_month_config` (
  `company_id` int NOT NULL,
  `year` int NOT NULL,
  `week` int NOT NULL,
  `month` int DEFAULT NULL,
  `opt_code` smallint DEFAULT NULL COMMENT '0 = no action\r\n1 = disable delivery order calender',
  PRIMARY KEY (`company_id`,`year`,`week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_packaging`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_packaging` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `packaging_id` int DEFAULT NULL,
  `length` int DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `uom` int DEFAULT NULL,
  `20_feet` int DEFAULT NULL,
  `40_feet` int DEFAULT NULL,
  `margin` int DEFAULT NULL,
  `packaging_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`division_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_price`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_price` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `product_code` int NOT NULL,
  `price` decimal(18,4) DEFAULT NULL,
  `uom` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`,`company_id`,`distributor_id`,`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_product`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_product` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_sku` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_type_id` int DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `flavour_id` int DEFAULT NULL,
  `net_weight` int DEFAULT NULL,
  `ctn_length` int DEFAULT NULL,
  `ctn_width` int DEFAULT NULL,
  `ctn_height` int DEFAULT NULL,
  `ctn_thick` int DEFAULT NULL,
  `banded` int DEFAULT NULL,
  `per_carton` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `created_by_id` int DEFAULT NULL,
  `last_update_date` date DEFAULT NULL,
  `updated_by_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `product_code` int DEFAULT NULL,
  `seasoning_type_id` int DEFAULT NULL,
  `product_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cont20` int DEFAULT NULL,
  `cont40` int DEFAULT NULL,
  `cont40hc` int DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  `tolling_id` int DEFAULT '0',
  `gross_weight` float DEFAULT NULL,
  `truck` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`division_id`,`product_id`),
  KEY `mst_product_company_id_IDX` (`company_id`,`product_code`,`active`) USING BTREE,
  KEY `mst_product_product_code_IDX` (`product_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_product_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_product_category` (
  `company_id` int NOT NULL,
  `prodcat_id` int NOT NULL,
  `prodcat_name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `prodccat_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`prodcat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_product_division`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_product_division` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_product_shape_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_product_shape_type` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `shape_id` int NOT NULL,
  `shape_name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shape_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`division_id`,`shape_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_product_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_product_type` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `product_type_id` bigint NOT NULL,
  `product_type_class` int DEFAULT NULL COMMENT '1 = Main Product, like Noodle, Flour, Cooking Oil',
  `factory_id` int DEFAULT NULL COMMENT 'A binary number can contains uo to 16 different factories',
  `product_type_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_type_descr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`division_id`,`product_type_id`),
  UNIQUE KEY `mst_product_type_un` (`company_id`,`division_id`,`product_type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_reason`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_reason` (
  `company_id` int DEFAULT NULL,
  `reason_id` int NOT NULL,
  `reason_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `flag` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  PRIMARY KEY (`reason_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_region`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_region` (
  `region_id` int NOT NULL,
  `region_name_id` int DEFAULT NULL,
  `region_desc` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdst` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`region_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_rm`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_rm` (
  `rm_id` int NOT NULL,
  `rm_code` int NOT NULL,
  `rm_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `samplecat_id` int NOT NULL,
  `rm_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fg_code` int DEFAULT NULL,
  `active` tinyint DEFAULT '0',
  `finished_date` date DEFAULT NULL,
  PRIMARY KEY (`rm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_serving_type`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_serving_type` (
  `company_id` int NOT NULL,
  `division_id` int NOT NULL,
  `serving_type_id` int NOT NULL,
  `serving_type_name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serving_type_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`division_id`,`serving_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_shipping_company`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_shipping_company` (
  `shipping_company_id` int NOT NULL,
  `company_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `company_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`shipping_company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_status_so`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_status_so` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`,`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_team`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_team` (
  `company_id` int NOT NULL,
  `team_id` int NOT NULL,
  `team_category` int DEFAULT NULL,
  `team_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `team_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rm_id` int DEFAULT NULL,
  `team_ref_id` smallint DEFAULT NULL COMMENT 'A reference to other team which already has the map to distributors',
  PRIMARY KEY (`company_id`,`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_team_category`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_team_category` (
  `company_id` int NOT NULL,
  `team_category_id` int NOT NULL,
  `category_name_id` int DEFAULT NULL,
  `category_descr` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`team_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_team_member`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_team_member` (
  `company_id` int NOT NULL,
  `team_id` int NOT NULL,
  `team_member_id` int NOT NULL,
  `team_member_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `team_member_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`team_id`,`team_member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_tolling`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_tolling` (
  `id` int NOT NULL,
  `descr` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factory_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_top`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_top` (
  `top_id` int NOT NULL,
  `top_sap_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` int NOT NULL,
  `due_days` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `other_due_days` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `expired_date` date DEFAULT NULL,
  `last_update_date` date DEFAULT NULL,
  `credit_limit` int NOT NULL,
  `rating` int DEFAULT NULL,
  `top_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`top_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_top_foreign_code`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_top_foreign_code` (
  `company_id` int NOT NULL,
  `id` int NOT NULL,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_days` int DEFAULT '0',
  `active` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_truck`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_truck` (
  `truck_id` int NOT NULL,
  `company_id` int NOT NULL,
  `police_no` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `truck_desc` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`truck_id`,`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mst_uom`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mst_uom` (
  `id` int DEFAULT NULL,
  `uom_code` varchar(10) DEFAULT NULL,
  `uom_desc` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `noodle_segment`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `noodle_segment` (
  `segment_id` int NOT NULL,
  `segment_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `change_date` date DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `segment_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`segment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_mst_employee`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_mst_employee` (
  `employee_id` int NOT NULL,
  `company_id` int NOT NULL,
  `person_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `terminate_date` date DEFAULT NULL,
  `adr_id` int DEFAULT NULL,
  `position_id` int DEFAULT NULL,
  `skill_group_id` int DEFAULT NULL,
  `appl_user_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_pswd` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_phone_nr` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appl_language` int DEFAULT NULL,
  `device_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_person`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_person` (
  `person_id` int NOT NULL,
  `firstname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suffix` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `typ` int DEFAULT NULL COMMENT '1 = employee\r\n2 = director\r\n4 = owner\r\n8 = distributor\r\n16 = rm\r\n32 = business analyst\r\n64 = acc manager\r\n128 = acc staff\r\n256 = logistic manager\r\n512 = logistic staff\r\n1024 = pdts manager\r\n2048 = pdts staff\r\n4096 = cost analyst manager\r\n8192 = cost analyst\r\n16384 = doc manager\r\n32768 = doc staff',
  `person_notice` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_dialog`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_dialog` (
  `dlg_id` int NOT NULL,
  `dlg_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  PRIMARY KEY (`dlg_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_dialog_info`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_dialog_info` (
  `dlg_id` int NOT NULL,
  `item_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `element_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` int DEFAULT NULL,
  PRIMARY KEY (`dlg_id`,`item_name`,`element_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_dialog_text`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_dialog_text` (
  `dlg_id` int NOT NULL,
  `text_id` int NOT NULL,
  `text_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`dlg_id`,`text_id`,`text_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_function`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_function` (
  `func_id` int NOT NULL,
  `text_id` int NOT NULL,
  `level` int DEFAULT NULL,
  `type` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `dialog_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `link` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int DEFAULT NULL,
  `description` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`func_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_group`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_group` (
  `group_id` int NOT NULL,
  `group_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `typ` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_group_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_group_item` (
  `group_id` int NOT NULL,
  `nr` int NOT NULL,
  `orderr` int DEFAULT NULL,
  `keyy` int DEFAULT NULL,
  `text_id` int DEFAULT NULL,
  `info` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notice` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`group_id`,`nr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_language`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_language` (
  `lang_id` int NOT NULL,
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso3` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`lang_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_text`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_text` (
  `lang_id` int NOT NULL,
  `text_id` int NOT NULL,
  `txt` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`lang_id`,`text_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ori_sys_user`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ori_sys_user` (
  `user_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `firstname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `uid` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pswd` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prev_pswd` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_pswd_changed` datetime DEFAULT NULL,
  `asin` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lang_id` int DEFAULT NULL,
  `last_login_date` datetime DEFAULT NULL,
  `active` int DEFAULT NULL,
  `user_notice` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_nr` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_date` datetime DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `person`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `person` (
  `person_id` int NOT NULL,
  `firstname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suffix` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `typ` int DEFAULT NULL COMMENT '1 = employee\r\n2 = director\r\n4 = owner\r\n8 = distributor\r\n16 = rm\r\n32 = business analyst\r\n64 = acc manager\r\n128 = acc staff\r\n256 = logistic manager\r\n512 = logistic staff\r\n1024 = pdts manager\r\n2048 = pdts staff\r\n4096 = cost analyst manager\r\n8192 = cost analyst\r\n16384 = doc manager\r\n32768 = doc staff',
  `person_notice` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `price_structure`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_structure` (
  `company_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `ps_id` int NOT NULL,
  `sku_id` int NOT NULL,
  `year` int NOT NULL,
  `start_date` date NOT NULL,
  `expired_date` date DEFAULT NULL,
  `cif` decimal(8,2) DEFAULT NULL,
  `fob` decimal(8,2) DEFAULT NULL,
  `tpromo` decimal(8,2) DEFAULT NULL,
  `marketing` decimal(8,2) DEFAULT NULL,
  `active` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `creation_date` date DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approval_date` date DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejected_date` date DEFAULT NULL,
  `rejected_reason` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checked_by` date DEFAULT NULL,
  `check_date` date DEFAULT NULL,
  `ps_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`distributor_id`,`ps_id`,`sku_id`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shipments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `shipment_id` int NOT NULL,
  `number` varchar(100) DEFAULT NULL,
  `so_id` bigint NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `sealine` varchar(100) DEFAULT NULL,
  `sealine_name` varchar(150) DEFAULT NULL,
  `last_updated_date` datetime NOT NULL,
  `status` varchar(100) DEFAULT NULL,
  KEY `idx_so_id` (`so_id`),
  KEY `idx_number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sql_audit_tracer`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sql_audit_tracer` (
  `action_date` datetime NOT NULL,
  `person_id` int NOT NULL,
  `sql_stmt` varchar(2058) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effected_rows` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sr_metadata`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sr_metadata` (
  `metadata_id` int NOT NULL,
  `type` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sealine` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sealine_name` varchar(225) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL COMMENT 'The date the data was received from the carrier. Date for UTC',
  `cache_expires` timestamp NULL DEFAULT NULL COMMENT 'The date before which the data for the current request was cached in our database. Date for UTC',
  `total_api_calls` int DEFAULT NULL COMMENT 'Data on the number of api calls',
  `used_api_calls` int DEFAULT NULL COMMENT 'Data on the number of unique shipments',
  `remaining_api_calls` int DEFAULT NULL COMMENT 'The balance of api calls for the current month',
  `total_unique_shipments` int DEFAULT NULL COMMENT 'Total number of api calls available for the current month',
  `used_unique_shipments` int DEFAULT NULL COMMENT 'The total number of unique shipments in the current month',
  `remaining_unique_shipments` int DEFAULT NULL COMMENT 'The balance of unique shipments for the current month',
  PRIMARY KEY (`metadata_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `str_do_header`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `str_do_header` (
  `company_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `do_number` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `do_date` int DEFAULT NULL,
  `po_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `sold_to_id` int DEFAULT NULL,
  `ship_to` int DEFAULT NULL,
  `so_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `do_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`supplier_id`,`do_number`,`so_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_company_defined_tables`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_company_defined_tables` (
  `company_id` int NOT NULL,
  `table_name` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_rows` int DEFAULT NULL,
  PRIMARY KEY (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dialog`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dialog` (
  `dlg_id` int NOT NULL,
  `dlg_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  PRIMARY KEY (`dlg_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dialog_info`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dialog_info` (
  `dlg_id` int NOT NULL,
  `item_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `element_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `group_id` int DEFAULT NULL,
  PRIMARY KEY (`dlg_id`,`item_name`,`element_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_dialog_text`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dialog_text` (
  `dlg_id` int NOT NULL,
  `text_id` int NOT NULL,
  `text_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`dlg_id`,`text_id`,`text_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_function`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_function` (
  `func_id` int NOT NULL,
  `text_id` int NOT NULL,
  `level` int DEFAULT NULL,
  `type` int DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `dialog_id` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `link` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort` int DEFAULT NULL,
  `description` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`func_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_group`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_group` (
  `group_id` int NOT NULL,
  `group_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int DEFAULT NULL,
  `description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `typ` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_group_item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_group_item` (
  `group_id` int NOT NULL,
  `nr` int NOT NULL,
  `orderr` int DEFAULT NULL,
  `keyy` int DEFAULT NULL,
  `text_id` int DEFAULT NULL,
  `info` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notice` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`group_id`,`nr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_language`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_language` (
  `lang_id` int NOT NULL,
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso3` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`lang_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_text`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_text` (
  `lang_id` int NOT NULL,
  `text_id` int NOT NULL,
  `txt` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`lang_id`,`text_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user` (
  `user_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `firstname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `uid` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pswd` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prev_pswd` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_pswd_changed` datetime DEFAULT NULL,
  `asin` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lang_id` int DEFAULT NULL,
  `last_login_date` datetime DEFAULT NULL,
  `last_active_date` datetime DEFAULT NULL COMMENT 'Every request for this user will be updated',
  `last_msg_read_time` datetime DEFAULT NULL,
  `active` int DEFAULT NULL,
  `user_notice` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_nr` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_date` datetime DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sys_user_function`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user_function` (
  `user_id` int NOT NULL,
  `func_id` int NOT NULL,
  `active` int DEFAULT NULL,
  PRIMARY KEY (`user_id`,`func_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_menu`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_menu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_data_update`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_data_update` (
  `support_id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint DEFAULT NULL,
  `system_name` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`support_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Store ticket detail data from Data Revision Update.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_doc_no`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_doc_no` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint DEFAULT NULL,
  `doc_no` varchar(100) DEFAULT NULL,
  `cstm_col` varchar(500) DEFAULT NULL,
  `lbl_col` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_mailer_eo`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_mailer_eo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cc` varchar(10000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `sent_date` datetime DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `t_ticket_assignment`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `t_ticket_assignment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(64) NOT NULL,
  `assigned_type` enum('user','team') NOT NULL,
  `assigned_id` bigint NOT NULL,
  `assigned_by` bigint DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unassigned_at` datetime DEFAULT NULL,
  `assignment_status` enum('active','completed','reassigned','cancelled') DEFAULT 'active',
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_ticket` (`ticket_id`),
  KEY `idx_assignee` (`assigned_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `temp`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp` (
  `id` int NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmp_fc`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmp_fc` (
  `invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` int DEFAULT NULL,
  `fc` decimal(19,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmp_so`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmp_so` (
  `company_id` int DEFAULT NULL,
  `so_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `rownum` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previd` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastid` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_anp_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_anp_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `so_id` bigint DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `docno` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cond_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_code` int DEFAULT NULL,
  `disc` double DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `curr_code` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` datetime DEFAULT NULL,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_trs_anp_detail_filter` (`company_id`,`so_id`,`docno`,`curr_code`,`is_deleted`),
  KEY `idx_trs_anp_detail_lookup` (`company_id`,`so_id`,`docno`,`product_code`,`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=198000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_approval`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_approval` (
  `id` bigint NOT NULL,
  `doc_id` int NOT NULL,
  `company_id` int NOT NULL,
  `created_date` date DEFAULT NULL,
  `flag` int DEFAULT NULL COMMENT '1 = Approved; 2= Rejected',
  `key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`,`company_id`),
  KEY `trs_approval_key_IDX` (`key`) USING BTREE,
  KEY `trs_approval_key_IDX2` (`key`,`company_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_approval_event`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_approval_event` (
  `id` bigint NOT NULL,
  `company_id` int NOT NULL,
  `appr_id` bigint NOT NULL,
  `appr_date` datetime DEFAULT NULL,
  `type` smallint DEFAULT NULL COMMENT '1 = normal; 2 = logistic; 3 = mst_approver',
  `employee_id` int DEFAULT NULL,
  `flag` smallint DEFAULT NULL,
  `reason` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`,`company_id`,`appr_id`),
  KEY `trs_approval_event_appr_date_IDX` (`appr_date`) USING BTREE,
  KEY `trs_approval_event_appr_id_IDX` (`appr_id`,`company_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_client_payment`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_client_payment` (
  `company_id` int NOT NULL,
  `client_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `year` int NOT NULL,
  `payment_value` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `bank_charge_1` decimal(6,2) DEFAULT '0.00' COMMENT 'NOT NEEDED',
  `payment_type` int DEFAULT '1' COMMENT 'Payment Type\n1 = payment for invoices\n2 = deposit\n ',
  `payment_rate_1` decimal(10,4) DEFAULT NULL,
  `active` int DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `creation_date` datetime DEFAULT NULL,
  `payment_descr` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`client_id`,`payment_id`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Information for the payment from clients	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_distributor_deal`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_distributor_deal` (
  `company_id` int NOT NULL,
  `deal_id` int NOT NULL,
  `distributor_id` int NOT NULL,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `deal_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`deal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_invoice`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_invoice` (
  `invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `count_po` int DEFAULT NULL,
  `vessel_name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stuff_date` date DEFAULT NULL,
  `etd` date DEFAULT NULL,
  `eta` date DEFAULT NULL,
  `bl_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lc_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lc_date` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fob` decimal(19,4) DEFAULT NULL,
  `freight` decimal(19,4) DEFAULT NULL,
  `insurance` decimal(19,4) DEFAULT NULL,
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `qr_export` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `freight_cost` decimal(19,4) DEFAULT NULL,
  `inspection` decimal(19,4) DEFAULT NULL,
  `border` decimal(19,4) DEFAULT NULL,
  `ship_line` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `atd` date DEFAULT NULL,
  `ata` date DEFAULT NULL,
  `scac` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`invoice_id`,`cont_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_mail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_mail` (
  `id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` smallint NOT NULL COMMENT '1=so',
  `appr_id1` int DEFAULT NULL,
  `flag1` tinyint DEFAULT NULL COMMENT '0=rejected; 1=approved',
  `update_date1` datetime DEFAULT NULL,
  `appr_id2` int DEFAULT NULL,
  `flag2` tinyint DEFAULT NULL COMMENT '0=rejected; 1=approved',
  `update_date2` datetime DEFAULT NULL,
  `appr_id3` int DEFAULT NULL,
  `flag3` tinyint DEFAULT NULL COMMENT '0=rejected; 1=approved',
  `update_date3` datetime DEFAULT NULL,
  `appr_id4` int DEFAULT NULL,
  `flag4` tinyint DEFAULT NULL COMMENT '0=rejected; 1=approved',
  `update_date4` datetime DEFAULT NULL,
  `appr_id5` int DEFAULT NULL,
  `flag5` tinyint DEFAULT NULL COMMENT '0=rejected; 1=approved',
  `update_date5` datetime DEFAULT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` tinyint DEFAULT NULL COMMENT '1=pending;2=approved;3=rejected'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_messages`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_messages` (
  `msg_id` int NOT NULL AUTO_INCREMENT,
  `company_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creator_id` int NOT NULL,
  `receiver_group_ids` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expired_date` datetime DEFAULT NULL,
  `last_update_date` datetime DEFAULT NULL,
  `status` decimal(2,0) DEFAULT NULL COMMENT 'Binary value 001 = 1 = CANCELED\r\n010 = 2 = FOR ALL MEMBER',
  `active_date` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` decimal(2,0) DEFAULT NULL,
  PRIMARY KEY (`msg_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Contains all messages between company	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_outstanding_ar`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_outstanding_ar` (
  `ar_doc_id` int DEFAULT NULL COMMENT 'This number is used for archiving purpose. User can later use the name for tracking the upload history',
  `company_id` int NOT NULL,
  `billing_doc_nr` int DEFAULT NULL,
  `foreign_distributor_id` int NOT NULL,
  `invoice_nr` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `exch_rate` decimal(10,4) NOT NULL,
  `pay_value` decimal(16,4) DEFAULT NULL,
  `pay_date` date DEFAULT NULL,
  `pay_exch_rate` decimal(10,4) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `balance` decimal(16,4) DEFAULT NULL,
  `due10` decimal(16,4) DEFAULT NULL COMMENT 'due 0 - 10 days',
  `due20` decimal(16,4) DEFAULT NULL COMMENT 'due 11 - 20 days',
  `due30` decimal(16,4) DEFAULT NULL COMMENT 'due 21 - 30 days',
  `due60` decimal(16,4) DEFAULT NULL COMMENT 'due 31 - 60 days',
  `due90` decimal(16,4) DEFAULT NULL COMMENT 'due 61 - 90 days',
  `due91` decimal(16,4) DEFAULT NULL COMMENT 'due > 90 days',
  `total_debt` decimal(16,4) DEFAULT NULL COMMENT 'Total debt of the ',
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  KEY `trs_outstanding_ar_billing_doc_nr_IDX` (`billing_doc_nr`) USING BTREE,
  KEY `trs_outstanding_ar_ar_doc_id_IDX` (`ar_doc_id`) USING BTREE,
  KEY `trs_outstanding_ar_foreign_distributor_id_IDX` (`foreign_distributor_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_outstanding_ar_header`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_outstanding_ar_header` (
  `doc_id` int NOT NULL AUTO_INCREMENT,
  `doc_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  `sheet_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`doc_id`),
  UNIQUE KEY `trs_outstanding_ar_header_un` (`doc_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1038 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Header for Outstanding AR Documents\r\n	';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_realization`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_realization` (
  `invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_pol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emkl` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rate` double DEFAULT NULL,
  `curr` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `do_stuff` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `do_buyer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `do_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bill_no` bigint DEFAULT NULL,
  `delv_date` date DEFAULT NULL,
  `week_delv` int DEFAULT NULL,
  `year_delv` int DEFAULT NULL,
  `so_id` bigint NOT NULL,
  `po_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_no` bigint DEFAULT NULL,
  `cont_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_line` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fwd` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etd` date DEFAULT NULL,
  `eta` date DEFAULT NULL,
  `remark` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `delv_stat` int DEFAULT NULL,
  `seal_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `freight_cost` double DEFAULT NULL,
  `insurance` double DEFAULT NULL,
  `atd` date DEFAULT NULL,
  `ata` date DEFAULT NULL,
  PRIMARY KEY (`invoice_id`,`cont_id`,`so_id`),
  KEY `trs_realization_delv_date_IDX` (`delv_date`) USING BTREE,
  KEY `trs_realization_year1_delv_idx` (`year_delv`) USING BTREE,
  KEY `trs_realization_so_id_IDX` (`so_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `after_realization_insert` AFTER INSERT ON `trs_realization` FOR EACH ROW begin
	
	DECLARE v_scac varchar(50);
	
	select msl.scac into v_scac 
	from sea_rates.m_shipping_line msl 
	where msl.i2i_shipline like concat('%',new.ship_line,'%') COLLATE utf8mb4_0900_ai_ci limit 1;
	
    -- Insert a new record into the trs_realization_searates table.
    -- We use the NEW keyword to get data from the row that was just inserted.
    INSERT INTO iod.trs_realization_searates(cont_id,so_id,scac)
    VALUES (NEW.cont_id,new.so_id,v_scac)
    on DUPLICATE key update
    scac = v_scac
    ;
	
	update iod.m_order mo inner join iod.trs_sales_order tso on tso.e_order = mo.order_id  
	set mo.status = 3 where tso.so_id = NEW.so_id;
	
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `trs_realization_batch`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_realization_batch` (
  `stuff_date` date NOT NULL,
  `invoice_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `container_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matcode` int NOT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stuff_qty` int DEFAULT NULL,
  `expired_date` date DEFAULT NULL,
  `prod_date` date DEFAULT NULL,
  PRIMARY KEY (`invoice_no`,`container_no`,`booking_no`,`matcode`,`batch_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_realization_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_realization_detail` (
  `invoice_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_id` bigint NOT NULL,
  `sku` int NOT NULL,
  `delv_date` date DEFAULT NULL,
  `uom` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `price` decimal(16,4) DEFAULT NULL,
  `discount` decimal(16,4) DEFAULT NULL,
  `freight` decimal(16,4) DEFAULT NULL,
  `filler` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `posm` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rpe_qty` int DEFAULT NULL,
  `fob` double DEFAULT NULL,
  PRIMARY KEY (`invoice_id`,`cont_id`,`so_id`,`sku`),
  KEY `trs_realization_detail_so_id_IDX` (`so_id`,`sku`) USING BTREE,
  KEY `idx_realization_so_sku` (`so_id`,`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_realization_searates`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_realization_searates` (
  `cont_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_id` bigint NOT NULL,
  `atd` date DEFAULT NULL,
  `ata` date DEFAULT NULL,
  `scac` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`cont_id`,`so_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_sales_order`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_sales_order` (
  `company_id` int NOT NULL,
  `so_id` bigint NOT NULL,
  `version` tinyint NOT NULL DEFAULT '0',
  `client_id` int NOT NULL,
  `so_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_date` date DEFAULT NULL,
  `po_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `po_date` date DEFAULT NULL,
  `ship_to_id` int NOT NULL,
  `bill_to_party` int DEFAULT NULL,
  `notify_party` int DEFAULT NULL,
  `notify_party2` int DEFAULT NULL,
  `pic_id` int DEFAULT NULL,
  `creation_date` date NOT NULL,
  `so_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `week_delv` int DEFAULT NULL,
  `year_delv` int DEFAULT NULL,
  `week_inv` int DEFAULT NULL,
  `year_inv` int DEFAULT NULL,
  `completion_note` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trade_promo` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cont20` int DEFAULT NULL,
  `cont40` int DEFAULT NULL,
  `cont40hc` int DEFAULT NULL,
  `flag` int DEFAULT NULL,
  `incoterm_id` int DEFAULT NULL,
  `factory_id` int DEFAULT NULL,
  `rm_id` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `port_shipment` int DEFAULT NULL,
  `final_dest` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cif_to` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delv_date` date DEFAULT NULL,
  `inv_date` date DEFAULT NULL,
  `cancel` int DEFAULT NULL,
  `reason_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `finish_date` date DEFAULT NULL,
  `approval_id` int DEFAULT NULL,
  `anp_no` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `top_id` int DEFAULT NULL,
  `truck` int DEFAULT NULL,
  `oth_anp` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `e_order` bigint DEFAULT NULL,
  `curr_code` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`company_id`,`so_id`,`version`,`client_id`),
  KEY `trs_sales_order_ship_to_id_IDX` (`ship_to_id`) USING BTREE,
  KEY `trs_sales_order_bill_to_party_IDX` (`bill_to_party`) USING BTREE,
  KEY `trs_sales_order_e_order_IDX` (`e_order`) USING BTREE,
  KEY `trs_sales_order_so_id_IDX` (`so_id`) USING BTREE,
  KEY `trs_sales_order_company_id_IDX` (`company_id`) USING BTREE,
  KEY `idx_sales_order_client_so_delv` (`client_id`,`so_id`,`delv_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_sales_payment_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_sales_payment_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `invoice_year` int NOT NULL,
  `billing_doc_nr` int NOT NULL,
  `foreign_distributor_id` int DEFAULT NULL COMMENT 'SAP Distributor ID',
  `payment_id` int DEFAULT NULL COMMENT 'Foreign key to the trs_client_payment table',
  `pay_value` decimal(12,4) DEFAULT NULL,
  `pay_date` date DEFAULT NULL,
  `pay_exch_rate` decimal(10,4) DEFAULT NULL,
  `bank_charge` decimal(7,4) DEFAULT '0.0000',
  `creation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` int DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `spd_descr` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bildocnr` (`billing_doc_nr`,`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=160295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_so_detail`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_so_detail` (
  `company_id` int NOT NULL,
  `so_id` bigint NOT NULL,
  `version` tinyint NOT NULL DEFAULT '0',
  `detail_nr` int NOT NULL,
  `client_id` int NOT NULL,
  `sku_id` int NOT NULL,
  `quantity` int NOT NULL,
  `value` decimal(18,2) DEFAULT NULL,
  `disc` decimal(18,3) DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `delivery_period` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_detail_desc` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `freight_surcharge` decimal(18,3) DEFAULT NULL,
  `rate_unit` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dist_channel` tinyint DEFAULT NULL,
  PRIMARY KEY (`company_id`,`so_id`,`version`,`detail_nr`),
  KEY `trs_so_detail_company_id_IDX` (`company_id`,`so_id`,`version`,`client_id`) USING BTREE,
  KEY `trs_so_detail_client_id_IDX` (`client_id`,`sku_id`,`company_id`) USING BTREE,
  KEY `idx_so_detail_so_client_sku` (`so_id`,`client_id`,`sku_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_user_message`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_user_message` (
  `msg_id` int NOT NULL,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_weekly_sales`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_weekly_sales` (
  `company_id` int NOT NULL,
  `billing_doc_nr` int NOT NULL,
  `foreign_distributor_id` int NOT NULL,
  `invoice_nr` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `invoice_value` decimal(12,4) NOT NULL,
  `exch_rate` decimal(10,4) NOT NULL,
  `due_date` date DEFAULT NULL,
  `due_days` int DEFAULT NULL COMMENT 'Each Invoice can be set to individuall due_days. \nInitial value will be set from the mst_top table with its expiry date.\n',
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `paid_status` int DEFAULT NULL COMMENT 'if NOT = 1 then if not fully aid and not closed',
  `update_date` date DEFAULT NULL,
  `update_by` int DEFAULT NULL,
  PRIMARY KEY (`company_id`,`billing_doc_nr`),
  KEY `idx_bildocnr` (`billing_doc_nr`,`company_id`),
  FULLTEXT KEY `ftx_invnr` (`invoice_nr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_weekly_sales_uploader`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_weekly_sales_uploader` (
  `company_id` int NOT NULL,
  `billing_doc_nr` int NOT NULL,
  `foreign_distributor_id` int NOT NULL,
  `invoice_nr` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `invoice_value` decimal(12,4) NOT NULL,
  `exch_rate` decimal(10,4) NOT NULL,
  `pay_value` decimal(12,4) DEFAULT NULL,
  `pay_date` date DEFAULT NULL,
  `pay_exch_rate` decimal(10,4) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `balance` decimal(10,4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_wor`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_wor` (
  `wor_header_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `invoice` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor Invoice',
  `id_container` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID Container',
  `truck` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nomor Polisi Truk',
  `emkl` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Perusahaan EMKL',
  `kurs` decimal(10,4) NOT NULL COMMENT 'Kurs Mata Uang',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Kode Mata Uang (ex: USD)',
  `sold_to_sap` bigint NOT NULL COMMENT 'SAP Sold-To Customer ID',
  `bill_to_sap` bigint NOT NULL COMMENT 'SAP Bill-To Customer ID',
  `price` decimal(10,4) NOT NULL COMMENT 'Harga Satuan',
  `discount` decimal(10,4) NOT NULL COMMENT 'Persentase/Nilai Diskon',
  `freight` decimal(10,4) NOT NULL COMMENT 'Biaya Freight',
  `fob_price` decimal(10,4) DEFAULT NULL COMMENT 'Harga FOB (Null Jika Kosong)',
  `freight_cost` decimal(10,4) DEFAULT NULL COMMENT 'Biaya Freight (Null Jika Kosong)',
  `insurance` decimal(10,4) DEFAULT NULL COMMENT 'Biaya Asuransi (Null Jika Kosong)',
  `do_no` bigint NOT NULL COMMENT 'Delivery Order Number',
  `billing_no` bigint NOT NULL COMMENT 'Billing Document Number',
  `pi_no` bigint NOT NULL COMMENT 'Proforma Invoice Number',
  `po_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Purchase Order Number',
  `so_no` bigint NOT NULL COMMENT 'Sales Order Number',
  `sku` bigint NOT NULL COMMENT 'Stock Keeping Unit / Material Code',
  `uom` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unit of Measure',
  `sum_of_total` int NOT NULL COMMENT 'Total Kuantitas',
  `rpe_qty` int NOT NULL COMMENT 'RPE Quantity',
  `size` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ukuran/Tipe (ex: Truck)',
  `status` int NOT NULL COMMENT 'Kode Status',
  `shipping_liner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Perusahaan Pelayaran (Null Jika Kosong)',
  `fwd` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Forwarder (Null Jika Kosong)',
  `kapal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nama Kapal (Null Jika Kosong)',
  `seal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Segel (Null Jika Kosong)',
  `book_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nomor Booking (Null Jika Kosong)',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan Umum (Null Jika Kosong)',
  `remarks_on_detail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catatan Detail (Null Jika Kosong)',
  `part_container_fillup` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Status Pengisian Container (Null Jika Kosong)',
  `gi_date` date NOT NULL COMMENT 'Good Issue Date (Format DD.MM.YYYY)',
  `week_g_issue` int NOT NULL COMMENT 'Minggu Good Issue',
  `etd` date NOT NULL COMMENT 'Estimated Time of Departure (Format DD.MM.YYYY)',
  `eta` date NOT NULL COMMENT 'Estimated Time of Arrival (Format DD.MM.YYYY)',
  `due_date_fni2i` date NOT NULL COMMENT 'Tanggal Jatuh Tempo Pembayaran (Format DD.MM.YYYY)',
  `updated_date` datetime DEFAULT NULL,
  PRIMARY KEY (`invoice`,`id_container`,`sku`,`so_no`,`gi_date`,`status`),
  KEY `trs_wor_trs_wor_header_FK` (`wor_header_id`),
  CONSTRAINT `trs_wor_trs_wor_header_FK` FOREIGN KEY (`wor_header_id`) REFERENCES `trs_wor_header` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trs_wor_header`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trs_wor_header` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doc_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `sheet_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `update_event`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `update_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `update_status` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_data_header`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_data_header` AS SELECT 
 1 AS `Shipment ID`,
 1 AS `Shipment Number`,
 1 AS `Shiment Type`,
 1 AS `Shipment Status`,
 1 AS `Consignee`,
 1 AS `Factory`,
 1 AS `Invoice Number`,
 1 AS `So ID`,
 1 AS `PO Buyer`,
 1 AS `Delivery Date`,
 1 AS `Incoterm`,
 1 AS `Container Number`,
 1 AS `BL Number`,
 1 AS `Sealine`,
 1 AS `Sealine Name`,
 1 AS `Vessel 1`,
 1 AS `Vessel 2`,
 1 AS `Vessel 3`,
 1 AS `Vessel 4`,
 1 AS `POL`,
 1 AS `ETD`,
 1 AS `ATD`,
 1 AS `POD`,
 1 AS `ETA`,
 1 AS `ATA`,
 1 AS `Transit Port 1`,
 1 AS `ETA TP1`,
 1 AS `ATA TP1`,
 1 AS `ETD TP1`,
 1 AS `ATD TP1`,
 1 AS `Transit Port 2`,
 1 AS `ETA TP2`,
 1 AS `ATA TP2`,
 1 AS `ETD TP2`,
 1 AS `ATD TP2`,
 1 AS `Transit Port 3`,
 1 AS `ETA TP3`,
 1 AS `ATA TP3`,
 1 AS `ETD TP3`,
 1 AS `ATD TP3`,
 1 AS `Transit Port 4`,
 1 AS `ETA TP4`,
 1 AS `ATA TP4`,
 1 AS `ETD TP4`,
 1 AS `ATD TP4`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_hots_linked_dist`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_hots_linked_dist` AS SELECT 
 1 AS `user_id`,
 1 AS `company_id`,
 1 AS `company_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_hots_po_onhand`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_hots_po_onhand` AS SELECT 
 1 AS `client_id`,
 1 AS `po_number`,
 1 AS `so_id`,
 1 AS `sku_id`,
 1 AS `quantity_dari_tsd`,
 1 AS `quantity_dari_trd`,
 1 AS `remaining_qty`,
 1 AS `close`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_rbb`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_rbb` AS SELECT 
 1 AS `invoice_id`,
 1 AS `factory_name`,
 1 AS `so_id`,
 1 AS `bl_no`,
 1 AS `cont_id`,
 1 AS `delv_date`,
 1 AS `sku`,
 1 AS `matcode`,
 1 AS `product_sku`,
 1 AS `stuff_qty`,
 1 AS `batch_no`,
 1 AS `prod_date`,
 1 AS `expired_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_realization_by_batch`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_realization_by_batch` AS SELECT 
 1 AS `invoice_id`,
 1 AS `factory_name`,
 1 AS `so_id`,
 1 AS `bl_no`,
 1 AS `cont_id`,
 1 AS `delv_date`,
 1 AS `sku`,
 1 AS `matcode`,
 1 AS `product_sku`,
 1 AS `stuff_qty`,
 1 AS `batch_no`,
 1 AS `prod_date`,
 1 AS `expired_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `v_shipment_by_batch_bl`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `v_shipment_by_batch_bl` (
  `invoice_id` varchar(100) DEFAULT NULL,
  `factory_name` varchar(64) DEFAULT NULL,
  `so_id r` bigint NOT NULL,
  `bl_no` varchar(100) DEFAULT NULL,
  `cont_id` varchar(100) DEFAULT NULL,
  `delv_date` date DEFAULT NULL,
  `matcode` int NOT NULL,
  `product_sku` varchar(32) DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `batch_no` varchar(100) DEFAULT NULL,
  `production_date` date DEFAULT NULL,
  `expired_date` date DEFAULT NULL,
  `shipment_id` int DEFAULT NULL,
  `number` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `so_id` bigint DEFAULT NULL,
  `sealine` varchar(100) DEFAULT NULL,
  `sealine_name` varchar(150) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `container_id` int DEFAULT NULL,
  `container_number` varchar(100) DEFAULT NULL,
  `size_type` varchar(100) DEFAULT NULL,
  `POL` varchar(100) DEFAULT NULL,
  `ETD` date DEFAULT NULL,
  `ATD` date DEFAULT NULL,
  `POD` varchar(100) DEFAULT NULL,
  `ETA` date DEFAULT NULL,
  `ATA` date DEFAULT NULL,
  `Transit Port 1` varchar(100) DEFAULT NULL,
  `ETA TP1` date DEFAULT NULL,
  `ATA TP1` date DEFAULT NULL,
  `ETD TP1` date DEFAULT NULL,
  `ATD TP1` date DEFAULT NULL,
  `Transit Port 2` varchar(100) DEFAULT NULL,
  `ETA TP2` date DEFAULT NULL,
  `ATA TP2` date DEFAULT NULL,
  `ETD TP2` date DEFAULT NULL,
  `ATD TP2` date DEFAULT NULL,
  `Transit Port 3` varchar(100) DEFAULT NULL,
  `ETA TP3` date DEFAULT NULL,
  `ATA TP3` date DEFAULT NULL,
  `ETD TP3` date DEFAULT NULL,
  `ATD TP3` date DEFAULT NULL,
  `Transit Port 4` varchar(100) DEFAULT NULL,
  `ETA TP4` date DEFAULT NULL,
  `ATA TP4` date DEFAULT NULL,
  `ETD TP4` date DEFAULT NULL,
  `ATD TP4` date DEFAULT NULL,
  `Vessel 1` varchar(400) DEFAULT NULL,
  `Vessel 2` varchar(400) DEFAULT NULL,
  `Vessel 3` varchar(400) DEFAULT NULL,
  `Vessel 4` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_stuffing_by_inv`
--

SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_stuffing_by_inv` AS SELECT 
 1 AS `Year`,
 1 AS `Month`,
 1 AS `factory`,
 1 AS `INV NO`,
 1 AS `Stuffing Date`,
 1 AS `ship_to_id`,
 1 AS `Ship To`,
 1 AS `Region`,
 1 AS `Country`,
 1 AS `Final Destination`,
 1 AS `so_id`,
 1 AS `bl_no`,
 1 AS `cont_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'iod'
--
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` FUNCTION `day2week`(_det varchar(30)) RETURNS int
    DETERMINISTIC
BEGIN
	DECLARE ans INT;
	SET ans = (SELECT
		MIN(WEEK) wikwik
	FROM
		dat_operational_calendar g
	WHERE
		g.opcal_id = LEFT(UNIX_TIMESTAMP(DATE_FORMAT(_det , '%Y-%m-%d')),8)
		AND YEAR(DATE_FORMAT(FROM_UNIXTIME(CONCAT(g.opcal_id, '00')), '%Y-%m-%d')) = YEAR(_det)); 
	
	RETURN ans;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` FUNCTION `generate_tp`(_str VARCHAR(500), _limiter VARCHAR(10), _podate VARCHAR(30)) RETURNS text CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    DETERMINISTIC
BEGIN
	DECLARE _next TEXT DEFAULT NULL;
	DECLARE _nextlen INT DEFAULT NULL;
	DECLARE _value TEXT DEFAULT NULL;
	DECLARE _yr TEXT DEFAULT NULL;
	DECLARE _out TEXT DEFAULT '';
	DECLARE _ngajelas TEXT DEFAULT '';
	
-- 	DROP TEMPORARY TABLE IF EXISTS list_anp;
-- 	CREATE TEMPORARY TABLE list_anp(
-- 	    docno varchar(100)
-- 	);

	iterator:
	LOOP
	  -- exit the loop if the list seems empty or was null;
	  -- this extra caution is necessary to avoid an endless loop in the proc.
	  IF CHAR_LENGTH(TRIM(_str)) = 0 OR _str IS NULL THEN
	    LEAVE iterator;
	  END IF;
	 
	  -- capture the next value from the list
	  SET _next = SUBSTRING_INDEX(_str,_limiter,1);
	
	  -- save the length of the captured value; we will need to remove this
	  -- many characters + 1 from the beginning of the string 
	  -- before the next iteration
	  SET _nextlen = CHAR_LENGTH(_next);
	
	  -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
	  SET _value = TRIM(_next);
	  
	  IF locate(',', _value) THEN
	  	SET _yr = substring_index(_value,',',-1);
	    SET _value = substring_index(_value,',',1);
	  ELSE 
	    SET _yr = year(_podate);
	  END IF;
	 
-- 	  INSERT INTO list_anp VALUES (_value,'/IOD/',_yr);

	  SET _out = CONCAT(_value,'/IOD/',_yr);
	 
	  SET _ngajelas = CONCAT(_ngajelas,', ',(SELECT concat(_yr,'/',_value,RIGHT(cond_type,3)) FROM dat_wbs_anp WHERE docno = _out LIMIT 1));
	 
-- 	  SET _out = (_value,'/IOD/',_yr,',',_out);
	 
	  -- SET _out = concat(LEFT(_out,LENGTH(_out)-1),'''');
	  
	  -- rewrite the original string using the `INSERT()` string function,
	  -- args are original string, start position, how many characters to remove, 
	  -- and what to "insert" in their place (in this case, we "insert"
	  -- an empty string, which removes _nextlen + 1 characters)
	  SET _str = INSERT(_str,1,_nextlen + 1,'');
	END LOOP;

	RETURN trim(RIGHT(_ngajelas,LENGTH(_ngajelas)-1));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` FUNCTION `number_to_word`(n decimal(18,2), curr_code varchar(3)) RETURNS varchar(200) CHARSET utf8mb4
    DETERMINISTIC
BEGIN

    declare ans varchar(200);

    declare cent varchar(10);

    declare dig1, dig2, dig3, dig4, dig5, dig6, dig7, dig8, dig9 int;

   	DECLARE curr varchar(20);


DECLARE num1,num2 varchar(100);

set ans = '';

set cent = '';

SET curr = CASE curr_code WHEN 'USD' THEN ' Dollars' WHEN 'EUR' THEN ' Euros' WHEN 'IDR' THEN ' Rupiah' WHEN 'CNY' THEN ' Yuan' WHEN 'QTY' THEN ' Cartons' END;

IF n != '' THEN 



set num1 = SUBSTRING_INDEX(n, ".", 1);

set num2 = SUBSTRING_INDEX(n, '.', -1);


set dig9 = CAST(RIGHT(CAST(floor(num1 / 100000000) as CHAR(8)), 1) as SIGNED);

set dig8 = CAST(RIGHT(CAST(floor(num1 / 10000000) as CHAR(8)), 1) as SIGNED);

set dig7 = CAST(RIGHT(CAST(floor(num1 / 1000000) as CHAR(8)), 1) as SIGNED);

set dig6 = CAST(RIGHT(CAST(floor(num1 / 100000) as CHAR(8)), 1) as SIGNED);

set dig5 = CAST(RIGHT(CAST(floor(num1 / 10000) as CHAR(8)), 1) as SIGNED);

set dig4 = CAST(RIGHT(CAST(floor(num1 / 1000) as CHAR(8)), 1) as SIGNED);

set dig3 = CAST(RIGHT(CAST(floor(num1 / 100) as CHAR(8)), 1) as SIGNED);

set dig2 = CAST(RIGHT(CAST(floor(num1 / 10) as CHAR(8)), 1) as SIGNED);

set dig1 = CAST(RIGHT(floor(num1), 1) as SIGNED);



IF num1 != '' THEN

if dig9 > 0 then

    case

        when dig9=1 then set ans=concat(ans, 'One Hundred');

        when dig9=2 then set ans=concat(ans, 'Two Hundred');

	    when dig9=3 then set ans=concat(ans, 'Three Hundred');

	    when dig9=4 then set ans=concat(ans, 'Four Hundred');

	    when dig9=5 then set ans=concat(ans, 'Five Hundred');

	    when dig9=6 then set ans=concat(ans, 'Six Hundred');

	    when dig9=7 then set ans=concat(ans, 'Seven Hundred');

	    when dig9=8 then set ans=concat(ans, 'Eight Hundred');

	    when dig9=9 then set ans=concat(ans, 'Nine Hundred');

        else set ans=ans;

    end case;

	END IF;

if dig8 = 1 then

    case

        when (dig8*10 + dig7) = 10 then set ans=concat(ans, ' Ten Million ');

        when (dig8*10 + dig7) = 11 then set ans=concat(ans, ' Eleven Million ');

        when (dig8*10 + dig7) = 12 then set ans=concat(ans, ' Twelve Million ');

        when (dig8*10 + dig7) = 13 then set ans=concat(ans, ' Thirteen Million ');

        when (dig8*10 + dig7) = 14 then set ans=concat(ans, ' Fourteen Million ');

        when (dig8*10 + dig7) = 15 then set ans=concat(ans, ' Fifteen Million ');

        when (dig8*10 + dig7) = 16 then set ans=concat(ans, ' Sixteen Million ');

        when (dig8*10 + dig7) = 17 then set ans=concat(ans, ' Seventeen Million ');

        when (dig8*10 + dig7) = 18 then set ans=concat(ans, ' Eighteen Million ');

        when (dig8*10 + dig7) = 19 then set ans=concat(ans, ' Nineteen Million ');

        else set ans=ans;

    end case;

else

	if dig8 > 0 then

        case

            when dig8=2 then set ans=concat(ans, ' Twenty');

            when dig8=3 then set ans=concat(ans, ' Thirty');

            when dig8=4 then set ans=concat(ans, ' Forty');

            when dig8=5 then set ans=concat(ans, ' Fifty');

            when dig8=6 then set ans=concat(ans, ' Sixty');

            when dig8=7 then set ans=concat(ans, ' Seventy');

            when dig8=8 then set ans=concat(ans, ' Eighty');

            when dig8=9 then set ans=concat(ans, ' Ninety');

            else set ans=ans;

        end case;

    end if;

    if dig7 > 0 then

        case

            when dig7=1 then set ans=concat(ans, ' One Million ');

            when dig7=2 then set ans=concat(ans, ' Two Million ');

            when dig7=3 then set ans=concat(ans, ' Three Million ');

            when dig7=4 then set ans=concat(ans, ' Four Million ');

            when dig7=5 then set ans=concat(ans, ' Five Million ');

            when dig7=6 then set ans=concat(ans, ' Six Million ');

            when dig7=7 then set ans=concat(ans, ' Seven Million ');

            when dig7=8 then set ans=concat(ans, ' Eight Million ');

            when dig7=9 then set ans=concat(ans, ' Nine Million ');

            else set ans=ans;

        end case;

    end if;

END IF;

   if dig6 > 0 then

	    case

	        when dig6=1 then set ans=concat(ans, 'One Hundred');

	        when dig6=2 then set ans=concat(ans, 'Two Hundred');

	        when dig6=3 then set ans=concat(ans, 'Three Hundred');

	        when dig6=4 then set ans=concat(ans, 'Four Hundred');

	        when dig6=5 then set ans=concat(ans, 'Five Hundred');

	        when dig6=6 then set ans=concat(ans, 'Six Hundred');

	        when dig6=7 then set ans=concat(ans, 'Seven Hundred');

	        when dig6=8 then set ans=concat(ans, 'Eight Hundred');

	        when dig6=9 then set ans=concat(ans, 'Nine Hundred');

	        else set ans = ans;

	    end case;

	end if;

if dig5 = 1 then

    case

        when (dig5*10 + dig4) = 10 then set ans=concat(ans, ' Ten Thousand ');

        when (dig5*10 + dig4) = 11 then set ans=concat(ans, ' Eleven Thousand ');

        when (dig5*10 + dig4) = 12 then set ans=concat(ans, ' Twelve Thousand ');

        when (dig5*10 + dig4) = 13 then set ans=concat(ans, ' Thirteen Thousand ');

        when (dig5*10 + dig4) = 14 then set ans=concat(ans, ' Fourteen Thousand ');

        when (dig5*10 + dig4) = 15 then set ans=concat(ans, ' Fifteen Thousand ');

        when (dig5*10 + dig4) = 16 then set ans=concat(ans, ' Sixteen Thousand ');

        when (dig5*10 + dig4) = 17 then set ans=concat(ans, ' Seventeen Thousand ');

        when (dig5*10 + dig4) = 18 then set ans=concat(ans, ' Eighteen Thousand ');

        when (dig5*10 + dig4) = 19 then set ans=concat(ans, ' Nineteen Thousand ');

        else set ans=ans;

    end case;

ELSE

    if dig5 > 0 then

        case

            when dig5=2 then set ans=concat(ans, ' Twenty');

            when dig5=3 then set ans=concat(ans, ' Thirty');

            when dig5=4 then set ans=concat(ans, ' Forty');

            when dig5=5 then set ans=concat(ans, ' Fifty');

            when dig5=6 then set ans=concat(ans, ' Sixty');

            when dig5=7 then set ans=concat(ans, ' Seventy');

            when dig5=8 then set ans=concat(ans, ' Eighty');

            when dig5=9 then set ans=concat(ans, ' Ninety');

            else set ans=ans;

        end case;

    end if;

    if dig4 > 0 then

        case

            when dig4=1 then set ans=concat(ans, ' One Thousand ');

            when dig4=2 then set ans=concat(ans, ' Two Thousand ');

            when dig4=3 then set ans=concat(ans, ' Three Thousand ');

            when dig4=4 then set ans=concat(ans, ' Four Thousand ');

            when dig4=5 then set ans=concat(ans, ' Five Thousand ');

            when dig4=6 then set ans=concat(ans, ' Six Thousand ');

            when dig4=7 then set ans=concat(ans, ' Seven Thousand ');

            when dig4=8 then set ans=concat(ans, ' Eight Thousand ');

            when dig4=9 then set ans=concat(ans, ' Nine Thousand ');

            else set ans=ans;

        end case;

    end if;

    if dig4 = 0 AND (dig5 != 0 || dig6 != 0) then

        set ans=concat(ans, ' Thousand ');

    end if;

end if;



if dig3 > 0 then

    case

        when dig3=1 then set ans=concat(ans, 'One Hundred');

        when dig3=2 then set ans=concat(ans, 'Two Hundred');

        when dig3=3 then set ans=concat(ans, 'Three Hundred');

        when dig3=4 then set ans=concat(ans, 'Four Hundred');

        when dig3=5 then set ans=concat(ans, 'Five Hundred');

        when dig3=6 then set ans=concat(ans, 'Six Hundred');

        when dig3=7 then set ans=concat(ans, 'Seven Hundred');

        when dig3=8 then set ans=concat(ans, 'Eight Hundred');

        when dig3=9 then set ans=concat(ans, 'Nine Hundred');

        else set ans = ans;

    end case;

end if;



if dig2 = 1 then

    case

        when (dig2*10 + dig1) = 10 then set ans=concat(ans, ' Ten');

        when (dig2*10 + dig1) = 11 then set ans=concat(ans, ' Eleven');

        when (dig2*10 + dig1) = 12 then set ans=concat(ans, ' Twelve');

        when (dig2*10 + dig1) = 13 then set ans=concat(ans, ' Thirteen');

        when (dig2*10 + dig1) = 14 then set ans=concat(ans, ' Fourteen');

        when (dig2*10 + dig1) = 15 then set ans=concat(ans, ' Fifteen');

        when (dig2*10 + dig1) = 16 then set ans=concat(ans, ' Sixteen');

        when (dig2*10 + dig1) = 17 then set ans=concat(ans, ' Seventeen');

        when (dig2*10 + dig1) = 18 then set ans=concat(ans, ' Eighteen');

        when (dig2*10 + dig1) = 19 then set ans=concat(ans, ' Nineteen');

        else set ans=ans;

    end case;

else

    if dig2 > 0 then

        case

            when dig2=2 then set ans=concat(ans, ' Twenty');

            when dig2=3 then set ans=concat(ans, ' Thirty');

            when dig2=4 then set ans=concat(ans, ' Forty');

            when dig2=5 then set ans=concat(ans, ' Fifty');

            when dig2=6 then set ans=concat(ans, ' Sixty');

            when dig2=7 then set ans=concat(ans, ' Seventy');

            when dig2=8 then set ans=concat(ans, ' Eighty');

            when dig2=9 then set ans=concat(ans, ' Ninety');

            else set ans=ans;

        end case;

    end if;

    if dig1 > 0 then

        case

            when dig1=1 then set ans=concat(ans, ' One');

            when dig1=2 then set ans=concat(ans, ' Two');

            when dig1=3 then set ans=concat(ans, ' Three');

            when dig1=4 then set ans=concat(ans, ' Four');

            when dig1=5 then set ans=concat(ans, ' Five');

            when dig1=6 then set ans=concat(ans, ' Six');

            when dig1=7 then set ans=concat(ans, ' Seven');

            when dig1=8 then set ans=concat(ans, ' Eight');

            when dig1=9 then set ans=concat(ans, ' Nine');

            else set ans=ans;

        end case;

    end if;

end if;

end if;

set ans=concat(trim(ans), curr);

IF num2 > 0 then

    set dig2 = CAST(RIGHT(CAST(floor(num2 / 10) as CHAR(8)), 1) as SIGNED);

    set dig1 = CAST(RIGHT(floor(num2), 1) as SIGNED);

    set cent= ' Cents';



    if dig2 = 1 then

	    case
	
	        when (dig2*10 + dig1) = 10 then set ans=concat(ans, ' Ten');
	
	        when (dig2*10 + dig1) = 11 then set ans=concat(ans, ' Eleven');
	
	        when (dig2*10 + dig1) = 12 then set ans=concat(ans, ' Twelve');
	
	        when (dig2*10 + dig1) = 13 then set ans=concat(ans, ' Thirteen');
	
	        when (dig2*10 + dig1) = 14 then set ans=concat(ans, ' Fourteen');
	
	        when (dig2*10 + dig1) = 15 then set ans=concat(ans, ' Fifteen');
	
	        when (dig2*10 + dig1) = 16 then set ans=concat(ans, ' Sixteen');
	
	        when (dig2*10 + dig1) = 17 then set ans=concat(ans, ' Seventeen');
	
	        when (dig2*10 + dig1) = 18 then set ans=concat(ans, ' Eighteen');
	
	        when (dig2*10 + dig1) = 19 then set ans=concat(ans, ' Nineteen');
	
	        else set ans=ans;
	
	    end case;
	
	else

	    if dig2 > 0 then
	
	        case
			
	            when dig2=2 then set ans=concat(ans, ' Twenty');
	
	            when dig2=3 then set ans=concat(ans, ' Thirty');
	
	            when dig2=4 then set ans=concat(ans, ' Forty');
	
	            when dig2=5 then set ans=concat(ans, ' Fifty');
	
	            when dig2=6 then set ans=concat(ans, ' Sixty');
	
	            when dig2=7 then set ans=concat(ans, ' Seventy');
	
	            when dig2=8 then set ans=concat(ans, ' Eighty');
	
	            when dig2=9 then set ans=concat(ans, ' Ninety');
	
	            else set ans=ans;
	
	        end case;
	
	    end if;

	end if;

    if dig1 > 0 then

        case

            when dig1=0 then set ans=concat(ans, ' Zero');

            when dig1=1 then set ans=concat(ans, ' One');

            when dig1=2 then set ans=concat(ans, ' Two');

            when dig1=3 then set ans=concat(ans, ' Three');

            when dig1=4 then set ans=concat(ans, ' Four');

            when dig1=5 then set ans=concat(ans, ' five');

            when dig1=6 then set ans=concat(ans, ' Six');

            when dig1=7 then set ans=concat(ans, ' Seven');

            when dig1=8 then set ans=concat(ans, ' Eight');

            when dig1=9 then set ans=concat(ans, ' Nine');

            else set ans=ans;

        end case;

    end if;

END IF;

END IF;



return concat(trim(ans), cent);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` FUNCTION `random_int`(value_minimum INT, value_maximum INT) RETURNS int
    DETERMINISTIC
BEGIN	
	RETURN FLOOR(value_minimum + RAND() * (value_maximum - value_minimum + 1));
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` FUNCTION `split_tp`(_str VARCHAR(500), _limiter VARCHAR(10), _podate VARCHAR(30)) RETURNS text CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    DETERMINISTIC
BEGIN
	DECLARE _next TEXT DEFAULT NULL;
	DECLARE _nextlen INT DEFAULT NULL;
	DECLARE _value TEXT DEFAULT NULL;
	DECLARE _yr TEXT DEFAULT NULL;
	DECLARE _out TEXT DEFAULT '';
	
-- 	DROP TEMPORARY TABLE IF EXISTS list_anp;
-- 	CREATE TEMPORARY TABLE list_anp(
-- 	    docno varchar(100)
-- 	);

	iterator:
	LOOP
	  -- exit the loop if the list seems empty or was null;
	  -- this extra caution is necessary to avoid an endless loop in the proc.
	  IF CHAR_LENGTH(TRIM(_str)) = 0 OR _str IS NULL THEN
	    LEAVE iterator;
	  END IF;
	 
	  -- capture the next value from the list
	  SET _next = SUBSTRING_INDEX(_str,_limiter,1);
	
	  -- save the length of the captured value; we will need to remove this
	  -- many characters + 1 from the beginning of the string 
	  -- before the next iteration
	  SET _nextlen = CHAR_LENGTH(_next);
	
	  -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
	  SET _value = TRIM(_next);
	  
	  IF locate(',', _value) THEN
	  	SET _yr = substring_index(_value,',',-1);
	    SET _value = substring_index(_value,',',1);
	  ELSE 
	    SET _yr = year(_podate);
	  END IF;
	 
-- 	  INSERT INTO list_anp VALUES (_value,'/IOD/',_yr);
	 
	  SET _out = CONCAT(_value,'/IOD/',_yr,',',_out);
	 
	  -- SET _out = concat(LEFT(_out,LENGTH(_out)-1),'''');
	  
	  -- rewrite the original string using the `INSERT()` string function,
	  -- args are original string, start position, how many characters to remove, 
	  -- and what to "insert" in their place (in this case, we "insert"
	  -- an empty string, which removes _nextlen + 1 characters)
	  SET _str = INSERT(_str,1,_nextlen + 1,'');
	END LOOP;

	RETURN LEFT(_out,LENGTH(_out)-1);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `delete_order`(IN _id BIGINT)
    DETERMINISTIC
BEGIN
		DECLARE EXIT HANDLER FOR SQLEXCEPTION 
		    BEGIN
		        ROLLBACK;
		       	SELECT 'An error has occurred, operation rollbacked and the stored procedure was terminated'; 
		    END;

		START TRANSACTION;
			DELETE FROM m_order WHERE order_id = _id;
			DELETE FROM m_order_dtl WHERE order_id = _id;
			DELETE FROM m_summary WHERE order_id = _id;
			DELETE a FROM trs_so_detail a INNER JOIN trs_sales_order b ON a.so_id = b.so_id AND a.version = b.version WHERE b.e_order = _id;
			DELETE FROM trs_sales_order WHERE e_order = _id;
		COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `delete_po_order`(IN _po varchar(100), IN _client int, IN _yyyy INT)
    DETERMINISTIC
BEGIN
		DECLARE id BIGINT DEFAULT 0;
		DECLARE po_no varchar(100) ;
		DECLARE EXIT HANDLER FOR SQLEXCEPTION 
		    BEGIN
		        ROLLBACK;
		       	SELECT 'An error has occurred, operation rollbacked and the stored procedure was terminated'; 
		    END;
		   
		SELECT trim(_po) INTO po_no;	
		SELECT max(order_id) INTO id FROM m_order WHERE po_buyer = po_no AND company_id = _client AND YEAR(po_date) = _yyyy;  
		
		START TRANSACTION;
			DELETE FROM m_order WHERE order_id = id;
			DELETE FROM m_order_dtl WHERE order_id = id;
			DELETE FROM m_summary WHERE order_id = id;
			DELETE a FROM trs_so_detail a INNER JOIN trs_sales_order b ON a.so_id = b.so_id AND a.version = b.version WHERE b.e_order = id;
			DELETE FROM trs_sales_order WHERE e_order = id;
		COMMIT;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `del_order_bulk`(IN _mulai BIGINT, IN _selese BIGINT, OUT id BIGINT)
    DETERMINISTIC
BEGIN
	DECLARE done INT DEFAULT FALSE;
	DECLARE i bigint;
	DECLARE cur1 CURSOR FOR SELECT order_id FROM m_order mo WHERE order_id BETWEEN _mulai AND _selese ORDER BY order_id ASC;
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	CREATE TABLE tmp_del_order (id bigint);

	OPEN cur1;
	
	read_loop: LOOP
	  FETCH cur1 INTO i;
	  IF done THEN
	    LEAVE read_loop;
	  END IF;
	 
	  INSERT INTO tmp_del_order
	  SELECT i;
	 
	  CALL delete_order(i); 
	END LOOP;
	
	CLOSE cur1;
	
	SELECT * FROM tmp_del_order;
	DROP TABLE tmp_del_order;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `get_anp`(_str VARCHAR(500), _limiter VARCHAR(10), _podate VARCHAR(30))
    DETERMINISTIC
BEGIN
	DECLARE _next TEXT DEFAULT NULL;
	DECLARE _nextlen INT DEFAULT NULL;
	DECLARE _value TEXT DEFAULT NULL;
	DECLARE _yr TEXT DEFAULT NULL;
	DECLARE _out TEXT DEFAULT '';
	
	DROP TEMPORARY TABLE IF EXISTS list_anp;
	CREATE TEMPORARY TABLE list_anp(
	    docno varchar(100)
	);
	
	iterator:
	LOOP
	  -- exit the loop if the list seems empty or was null;
	  -- this extra caution is necessary to avoid an endless loop in the proc.
	  IF CHAR_LENGTH(TRIM(_str)) = 0 OR _str IS NULL THEN
	    LEAVE iterator;
	  END IF;
	 
	  -- capture the next value from the list
	  SET _next = SUBSTRING_INDEX(_str,_limiter,1);
	
	  -- save the length of the captured value; we will need to remove this
	  -- many characters + 1 from the beginning of the string 
	  -- before the next iteration
	  SET _nextlen = CHAR_LENGTH(_next);
	
	  -- trim the value of leading and trailing spaces, in case of sloppy CSV strings
	  SET _value = TRIM(_next);
	  
	  IF locate(',', _value) THEN
	  	SET _yr = substring_index(_value,',',-1);
	    SET _value = substring_index(_value,',',1);
	  ELSE 
	    SET _yr = year(_podate);
	  END IF;
	 
	  INSERT INTO list_anp VALUES (CONCAT(_value,'/IOD/',_yr));
	 
	  -- SET _out = CONCAT('''',_value,'/IOD/',_yr,'''',',',_out);
	 
	  -- SET _out = concat(LEFT(_out,LENGTH(_out)-1),'''');
	  
	  -- rewrite the original string using the `INSERT()` string function,
	  -- args are original string, start position, how many characters to remove, 
	  -- and what to "insert" in their place (in this case, we "insert"
	  -- an empty string, which removes _nextlen + 1 characters)
	  SET _str = INSERT(_str,1,_nextlen + 1,'');
	END LOOP;

	SELECT * FROM list_anp;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `insert_so`()
    DETERMINISTIC
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'An error has occurred, operation rollbacked and the stored procedure was terminated'; 
    END;
		
    START TRANSACTION;

    INSERT INTO trs_sales_order 
    SELECT 
        head.company_id,
        concat(
            RIGHT(year(now()),2),
            RIGHT(concat('00000', head.client_id),5),
            RIGHT(concat('00000', (
                SELECT CAST(RIGHT(max(so_id),5) AS UNSIGNED) + head.row_num 
                FROM trs_sales_order 
                WHERE client_id = head.client_id
            )),5)
        ) AS so_id,
        head.ver,
        head.client_id,
        head.so_number,
        head.delv_date AS so_date,
        head.po_buyer,
        head.po_date,
        COALESCE(head.ship_to, head.client_id) ship_to,
        head.bill,
        head.notify1,
        head.notify2,
        head.pic,
        head.create_date,
        head.so_desc,
        head.delv_week,
        head.year_delv,
        NULL week_inv,
        NULL year_inv,
        head.completion_note,
        head.trade_promo,
        head.cont20,
        head.cont40,
        head.cont40hc,
        head.flag,
        head.incoterm_id,
        head.factory,
        head.rm_id,
        head.created_by,
        head.port_shipment,
        head.final_dest,
        head.cif_to,
        head.delv_date,
        head.inv_date,
        head.cancel,
        head.reason_id,
        head.start_date,
        head.finish_date,
        head.approval_id,
        head.anp_no,
        head.top,
        head.truck,
        head.oth_anp,
        head.order_id,
        mc.curr_code
    FROM (
        SELECT DISTINCT 
            100 company_id, 
            0 ver, 
            a.company_id client_id, 
            NULL so_number, 
            now() so_date,
            CASE WHEN LENGTH(trim(a.po_buyer_pcl)) > 0 THEN a.po_buyer_pcl ELSE a.po_buyer END po_buyer, 
            a.po_date, 
            a.ship_to, 
            a.bill_to bill, 
            a.notify1 notify1, 
            a.notify2 notify2, 
            e.team_id pic, 
            now() create_date, 
            b.remarks so_desc, 
            CASE WHEN a.delv_week = 0 THEN g.week ELSE a.delv_week END delv_week, 
            a.delv_year year_delv, 
            COALESCE(concat(b.cont_qty, ' X ', c.container_name, ' / ', FORMAT(c.cbm,0)),'1 TRUCK') completion_note,
            NULL trade_promo, 
            NULL cont20, 
            NULL cont40, 
            NULL cont40hc, 
            0 flag, 
            COALESCE(p.incoterm_id,4) incoterm_id, 
            mt.factory_id factory, 
            e.rm_id, 
            a.created_by, 
            p.harbour_id port_shipment, 
            p.final_dest, 
            p.cifto cif_to, 
            CASE 
                WHEN DATE_FORMAT(a.po_date, '%Y-%m-%d') = DATE_FORMAT(a.stuffing_date, '%Y-%m-%d') 
                THEN COALESCE(DATE_FORMAT(FROM_UNIXTIME(concat(f.opcal_id, '00')), '%Y-%m-%d'), a.stuffing_date) 
                ELSE a.stuffing_date 
            END delv_date, 
            NULL inv_date, 
            0 cancel, 
            NULL reason_id, 
            NULL start_date, 
            now() finish_date, 
            NULL approval_id, 
            NULL anp_no, 
            min(t.top_id) top, 
            CASE a.tolling_id WHEN 1 THEN 1 WHEN 6 THEN 1 ELSE NULL END truck, 
            NULL oth_anp, 
            a.order_id, 
            ROW_NUMBER() OVER (
                PARTITION BY a.company_id, year(a.po_date)
                ORDER BY a.order_id
            ) AS row_num
        FROM m_order a 
            INNER JOIN m_order_dtl b ON a.order_id = b.order_id AND a.company_id = b.company_id 
            LEFT JOIN mst_container c ON b.cont_size = c.container_id 
            LEFT JOIN map_resp_for_dist d ON a.company_id = d.distributor_id 
                AND now() BETWEEN d.creation_date AND COALESCE(d.finish_date,'9999-12-31')
            INNER JOIN mst_team e ON d.team_id = e.team_id 
                AND d.company_id = e.company_id 
                AND e.team_category = 6 
            LEFT JOIN mst_top t ON a.company_id = t.company_id AND t.expired_date IS NULL 
            LEFT JOIN map_port_for_dist p ON a.company_id = p.distributor_id 
                AND p.company_id = 100 
                AND p.finish_date IS NULL 
                AND a.port_shipment = p.id 
            LEFT JOIN (
                SELECT min(opcal_id) opcal_id, `week`, `year` 
                FROM dat_operational_calendar 
                WHERE `year` >= YEAR(now()) 
                AND opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(now(),'%Y-%m-%d')), 8) 
                GROUP BY `week`, `year`
            ) f ON a.delv_week = f.`week` AND a.delv_year = f.`year` 
            LEFT JOIN (
                SELECT min(opcal_id) opcal_id, `week`, `year` 
                FROM dat_operational_calendar 
                WHERE `year` >= YEAR(now()) 
                AND opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(now(),'%Y-%m-%d')), 8) 
                GROUP BY `week`, `year`
            ) g ON a.delv_year = g.`year` 
            AND g.opcal_id = LEFT(unix_timestamp(DATE_FORMAT(a.stuffing_date ,'%Y-%m-%d')), 8) 
            LEFT JOIN mst_product mp ON b.sku1 = mp.product_code 
            LEFT JOIN mst_tolling mt ON mp.tolling_id = mt.id
        WHERE a.status = 0 
        GROUP BY a.company_id, a.order_id 
        ORDER BY a.order_id, b.detail_id
    ) head
    LEFT JOIN mst_company mc ON mc.company_id = head.client_id;

    INSERT INTO trs_so_detail 
    SELECT 
        a.company_id, 
        a.so_id, 
        a.`version` ver, 
        b.detail_id, 
        a.client_id, 
        b.sku, 
        b.qty, 
        0 value, 
        0 disc, 
        a.delv_date, 
        min(c.top_desc) delivery_period, 
        NULL sod_desc, 
        NULL freight, 
        d.curr_code, 
        2 dist_channel 
    FROM m_order mo 
        INNER JOIN trs_sales_order a ON mo.order_id = a.e_order 
        INNER JOIN m_summary b ON a.e_order = b.order_id AND a.client_id = b.company_id 
        LEFT JOIN mst_top c ON a.client_id = c.company_id AND c.expired_date IS NULL 
        LEFT JOIN mst_company d ON a.client_id = d.company_id 	
    WHERE mo.status = 0 
    GROUP BY 1,2,3,4,5 
    ORDER BY mo.order_id, b.detail_id;
			
    UPDATE m_order a 
    INNER JOIN trs_sales_order b ON a.order_id = b.e_order AND b.company_id = 100 
    LEFT JOIN mst_top c ON b.client_id = c.company_id AND c.expired_date IS NULL 
    SET a.status = CASE WHEN c.top_desc LIKE '%advance%' THEN 66 ELSE 1 END
    WHERE a.status = 0;

    CALL kill_all_sleep_connections();

    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `insert_so_single`(_id BIGINT)
    DETERMINISTIC
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'An error has occurred, operation rollbacked and the stored procedure was terminated'; 
    END;
		
    START TRANSACTION;

    INSERT INTO trs_sales_order 
    SELECT 
        head.company_id,
        concat(
            RIGHT(year(now()),2),
            RIGHT(concat('00000', head.client_id),5),
            RIGHT(concat('00000', (
                SELECT CAST(RIGHT(max(so_id),5) AS UNSIGNED) + head.row_num 
                FROM trs_sales_order 
                WHERE client_id = head.client_id
            )),5)
        ) AS so_id,
        head.ver,
        head.client_id,
        head.so_number,
        head.delv_date AS so_date,
        head.po_buyer,
        head.po_date,
        COALESCE(head.ship_to, head.client_id) ship_to,
        head.bill,
        head.notify1,
        head.notify2,
        head.pic,
        head.create_date,
        head.so_desc,
        head.delv_week,
        head.year_delv,
        NULL week_inv,
        NULL year_inv,
        head.completion_note,
        head.trade_promo,
        head.cont20,
        head.cont40,
        head.cont40hc,
        head.flag,
        head.incoterm_id,
        head.factory,
        head.rm_id,
        head.created_by,
        head.port_shipment,
        head.final_dest,
        head.cif_to,
        head.delv_date,
        head.inv_date,
        head.cancel,
        head.reason_id,
        head.start_date,
        head.finish_date,
        head.approval_id,
        head.anp_no,
        head.top,
        head.truck,
        head.oth_anp,
        head.order_id,
        mc.curr_code
    FROM (
        SELECT DISTINCT 
            100 company_id, 
            0 ver, 
            a.company_id client_id, 
            NULL so_number, 
            now() so_date,
            CASE WHEN LENGTH(trim(a.po_buyer_pcl)) > 0 THEN a.po_buyer_pcl ELSE a.po_buyer END po_buyer, 
            a.po_date, 
            a.ship_to, 
            a.bill_to bill, 
            a.notify1 notify1, 
            a.notify2 notify2, 
            e.team_id pic, 
            now() create_date, 
            b.remarks so_desc, 
            CASE WHEN a.delv_week = 0 THEN g.week ELSE a.delv_week END delv_week, 
            a.delv_year year_delv, 
            COALESCE(concat(b.cont_qty, ' X ', c.container_name, ' / ', FORMAT(c.cbm,0)),'1 TRUCK') completion_note,
            NULL trade_promo, 
            NULL cont20, 
            NULL cont40, 
            NULL cont40hc, 
            0 flag, 
            COALESCE(p.incoterm_id,4) incoterm_id, 
            mt.factory_id factory, 
            e.rm_id, 
            a.created_by, 
            p.harbour_id port_shipment, 
            p.final_dest, 
            p.cifto cif_to, 
            CASE 
                WHEN DATE_FORMAT(a.po_date, '%Y-%m-%d') = DATE_FORMAT(a.stuffing_date, '%Y-%m-%d') 
                THEN COALESCE(DATE_FORMAT(FROM_UNIXTIME(concat(f.opcal_id, '00')), '%Y-%m-%d'), a.stuffing_date) 
                ELSE a.stuffing_date 
            END delv_date, 
            NULL inv_date, 
            0 cancel, 
            NULL reason_id, 
            NULL start_date, 
            now() finish_date, 
            NULL approval_id, 
            NULL anp_no, 
            min(t.top_id) top, 
            CASE a.tolling_id WHEN 1 THEN 1 WHEN 6 THEN 1 ELSE NULL END truck, 
            NULL oth_anp, 
            a.order_id, 
            ROW_NUMBER() OVER (
                PARTITION BY a.company_id, year(a.po_date)
                ORDER BY a.order_id
            ) AS row_num
        FROM m_order a 
            INNER JOIN m_order_dtl b ON a.order_id = b.order_id AND a.company_id = b.company_id 
            LEFT JOIN mst_container c ON b.cont_size = c.container_id 
            LEFT JOIN map_resp_for_dist d ON a.company_id = d.distributor_id 
                AND now() BETWEEN d.creation_date AND COALESCE(d.finish_date,'9999-12-31')
            INNER JOIN mst_team e ON d.team_id = e.team_id 
                AND d.company_id = e.company_id 
                AND e.team_category = 6 
            LEFT JOIN mst_top t ON a.company_id = t.company_id AND t.expired_date IS NULL 
            LEFT JOIN map_port_for_dist p ON a.company_id = p.distributor_id 
                AND p.company_id = 100 
                AND p.finish_date IS NULL 
                AND a.port_shipment = p.id 
            LEFT JOIN (
                SELECT min(opcal_id) opcal_id, `week`, `year` 
                FROM dat_operational_calendar 
                WHERE `year` >= YEAR(now()) 
                AND opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(now(),'%Y-%m-%d')), 8) 
                GROUP BY `week`, `year`
            ) f ON a.delv_week = f.`week` AND a.delv_year = f.`year` 
            LEFT JOIN (
                SELECT min(opcal_id) opcal_id, `week`, `year` 
                FROM dat_operational_calendar 
                WHERE `year` >= YEAR(now()) 
                AND opcal_id >= LEFT(unix_timestamp(DATE_FORMAT(now(),'%Y-%m-%d')), 8) 
                GROUP BY `week`, `year`
            ) g ON a.delv_year = g.`year` 
            AND g.opcal_id = LEFT(unix_timestamp(DATE_FORMAT(a.stuffing_date ,'%Y-%m-%d')), 8) 
            LEFT JOIN mst_product mp ON b.sku1 = mp.product_code 
            LEFT JOIN mst_tolling mt ON mp.tolling_id = mt.id
        WHERE a.status = 0 
          AND a.order_id = _id 
        GROUP BY a.company_id, a.order_id 
        ORDER BY a.order_id, b.detail_id
    ) head
    LEFT JOIN mst_company mc ON mc.company_id = head.client_id;

    INSERT INTO trs_so_detail 
    SELECT 
        a.company_id, 
        a.so_id, 
        a.`version` ver, 
        b.detail_id, 
        a.client_id, 
        b.sku, 
        b.qty, 
        0 value, 
        0 disc, 
        a.delv_date, 
        min(c.top_desc) delivery_period,
        NULL sod_desc,
        NULL freight,
        d.curr_code,
        2 dist_channel 
    FROM m_order mo 
        INNER JOIN trs_sales_order a ON mo.order_id = a.e_order 
        INNER JOIN m_summary b ON a.e_order = b.order_id AND a.client_id = b.company_id 
        LEFT JOIN mst_top c ON a.client_id = c.company_id AND c.expired_date IS NULL 
        LEFT JOIN mst_company d ON a.client_id = d.company_id 	
    WHERE mo.status = 0 AND mo.order_id = _id 
    GROUP BY 1,2,3,4,5 
    ORDER BY mo.order_id, b.detail_id;
			
    UPDATE m_order a 
    INNER JOIN trs_sales_order b ON a.order_id = b.e_order AND b.company_id = 100 
    LEFT JOIN mst_top c ON b.client_id = c.company_id AND c.expired_date IS NULL 
    SET a.status = CASE WHEN c.top_desc LIKE '%advance%' THEN 66 ELSE 1 END
    WHERE a.status = 0 AND a.order_id = _id;
	
    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`dbadmin`@`%` PROCEDURE `kill_all_sleep_connections`()
BEGIN
  WHILE (SELECT count(*) as _count from information_schema.processlist where Command = 'Sleep') > 10 DO
    set @c := (SELECT concat('KILL ', id, ';') as c from information_schema.processlist where Command = 'Sleep' limit 1);
    prepare stmt from @c;
    execute stmt;
  END WHILE;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_data_header`
--

/*!50001 DROP VIEW IF EXISTS `v_data_header`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_data_header` AS select 1 AS `Shipment ID`,1 AS `Shipment Number`,1 AS `Shiment Type`,1 AS `Shipment Status`,1 AS `Consignee`,1 AS `Factory`,1 AS `Invoice Number`,1 AS `So ID`,1 AS `PO Buyer`,1 AS `Delivery Date`,1 AS `Incoterm`,1 AS `Container Number`,1 AS `BL Number`,1 AS `Sealine`,1 AS `Sealine Name`,1 AS `Vessel 1`,1 AS `Vessel 2`,1 AS `Vessel 3`,1 AS `Vessel 4`,1 AS `POL`,1 AS `ETD`,1 AS `ATD`,1 AS `POD`,1 AS `ETA`,1 AS `ATA`,1 AS `Transit Port 1`,1 AS `ETA TP1`,1 AS `ATA TP1`,1 AS `ETD TP1`,1 AS `ATD TP1`,1 AS `Transit Port 2`,1 AS `ETA TP2`,1 AS `ATA TP2`,1 AS `ETD TP2`,1 AS `ATD TP2`,1 AS `Transit Port 3`,1 AS `ETA TP3`,1 AS `ATA TP3`,1 AS `ETD TP3`,1 AS `ATD TP3`,1 AS `Transit Port 4`,1 AS `ETA TP4`,1 AS `ATA TP4`,1 AS `ETD TP4`,1 AS `ATD TP4` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_hots_linked_dist`
--

/*!50001 DROP VIEW IF EXISTS `v_hots_linked_dist`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_hots_linked_dist` AS select distinct `u`.`user_id` AS `user_id`,`mc`.`company_id` AS `company_id`,upper(`mc`.`company_name`) AS `company_name` from (((((`map_resp_for_dist` `md` left join `mst_team` `mt` on(((`md`.`team_id` = `mt`.`team_id`) and (`md`.`company_id` = `mt`.`company_id`)))) left join `mst_team_member` `mtm` on(((`mtm`.`team_id` = `mt`.`team_id`) and (`mtm`.`company_id` = `mt`.`company_id`)))) left join `mst_employee` `me` on((`mtm`.`employee_id` = `me`.`employee_id`))) left join `hots`.`user` `u` on((`me`.`employee_id` = `u`.`employee_id`))) left join `mst_company` `mc` on((`md`.`distributor_id` = `mc`.`company_id`))) where ((`md`.`finish_date` is null) and (`mc`.`company_type_id` = 2) and (`mc`.`parent_company_id` = 100)) union select 0 AS `0`,999998 AS `999998`,'SPIT IOD - Lt. 23' AS `company_name` union select 0 AS `0`,999999 AS `999999`,upper('Kedutaan Besar Republik Indonesia (KBRI)') AS `company_name` order by `user_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_hots_po_onhand`
--

/*!50001 DROP VIEW IF EXISTS `v_hots_po_onhand`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_hots_po_onhand` AS select `tso`.`client_id` AS `client_id`,`tso`.`po_number` AS `po_number`,`tsd`.`so_id` AS `so_id`,`tsd`.`sku_id` AS `sku_id`,`tsd`.`quantity` AS `quantity_dari_tsd`,coalesce(sum(`trd`.`qty`),0) AS `quantity_dari_trd`,greatest((`tsd`.`quantity` - coalesce(sum(`trd`.`qty`),0)),0) AS `remaining_qty`,`dc`.`close` AS `close` from (((`trs_so_detail` `tsd` join `trs_sales_order` `tso` on(((`tsd`.`so_id` = `tso`.`so_id`) and (`tsd`.`client_id` = `tso`.`client_id`)))) join `dat_cwo` `dc` on(((`tsd`.`so_id` = `dc`.`so_id`) and (`tsd`.`sku_id` = `dc`.`product_code`)))) left join `trs_realization_detail` `trd` on(((`tsd`.`so_id` = `trd`.`so_id`) and (`tsd`.`sku_id` = `trd`.`sku`)))) where ((`dc`.`close` = 0) and (`tso`.`delv_date` >= makedate(year(curdate()),1))) group by `tso`.`po_number`,`tsd`.`so_id`,`tsd`.`sku_id`,`tsd`.`quantity`,`dc`.`close` having (greatest((`tsd`.`quantity` - coalesce(sum(`trd`.`qty`),0)),0) > 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_rbb`
--

/*!50001 DROP VIEW IF EXISTS `v_rbb`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_rbb` AS select 1 AS `invoice_id`,1 AS `factory_name`,1 AS `so_id`,1 AS `bl_no`,1 AS `cont_id`,1 AS `delv_date`,1 AS `sku`,1 AS `matcode`,1 AS `product_sku`,1 AS `stuff_qty`,1 AS `batch_no`,1 AS `prod_date`,1 AS `expired_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_realization_by_batch`
--

/*!50001 DROP VIEW IF EXISTS `v_realization_by_batch`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_realization_by_batch` AS select 1 AS `invoice_id`,1 AS `factory_name`,1 AS `so_id`,1 AS `bl_no`,1 AS `cont_id`,1 AS `delv_date`,1 AS `sku`,1 AS `matcode`,1 AS `product_sku`,1 AS `stuff_qty`,1 AS `batch_no`,1 AS `prod_date`,1 AS `expired_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_stuffing_by_inv`
--

/*!50001 DROP VIEW IF EXISTS `v_stuffing_by_inv`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_stuffing_by_inv` AS select `tr`.`year_delv` AS `Year`,monthname(`tr`.`delv_date`) AS `Month`,`mf`.`factory_name` AS `factory`,`tr`.`invoice_id` AS `INV NO`,`tr`.`delv_date` AS `Stuffing Date`,`tso`.`ship_to_id` AS `ship_to_id`,`mc`.`company_name` AS `Ship To`,`mr`.`region_desc` AS `Region`,`mc2`.`country_desc` AS `Country`,`tso`.`final_dest` AS `Final Destination`,`tr`.`so_id` AS `so_id`,`ti`.`bl_no` AS `bl_no`,replace(`tr`.`cont_id`,'-','') AS `cont_id` from (((((((`trs_realization` `tr` left join `trs_invoice` `ti` on(((`tr`.`invoice_id` = `ti`.`invoice_id`) and (`ti`.`cont_id` = `tr`.`cont_id`)))) left join `trs_sales_order` `tso` on((`tr`.`so_id` = `tso`.`so_id`))) left join `mst_company` `mc` on((`tso`.`ship_to_id` = `mc`.`company_id`))) left join `mst_country` `mc2` on((`mc`.`country_id` = `mc2`.`country_id`))) left join `map_region_countries` `mrc` on((`mrc`.`country_id` = `mc2`.`country_id`))) left join `mst_region` `mr` on((`mrc`.`region_id` = `mr`.`region_id`))) left join `mst_factory` `mf` on((`tso`.`factory_id` = `mf`.`factory_id`))) where ((`tr`.`year_delv` = year(curdate())) and (`tso`.`factory_id` in (1,2,64,2048))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 10:39:48

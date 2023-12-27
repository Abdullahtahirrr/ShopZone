CREATE TABLE `addresses` (
  `address_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `country_id` int NOT NULL,
  `city_id` int NOT NULL,
  `street_address` varchar(255) NOT NULL,
  PRIMARY KEY (`address_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `country_id` (`country_id`),
  KEY `city_id` (`city_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_accounts` (`buyer_id`),
  CONSTRAINT `addresses_ibfk_2` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`),
  CONSTRAINT `addresses_ibfk_4` FOREIGN KEY (`city_id`) REFERENCES `cities` (`city_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `buyer_accounts` (
  `buyer_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint DEFAULT NULL,
  PRIMARY KEY (`buyer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `buyer_profile` (
  `buyer_id` int NOT NULL,
  `f_name` varchar(23) COLLATE utf8mb4_unicode_ci NOT NULL,
  `l_name` varchar(23) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`buyer_id`),
  CONSTRAINT `buyer_profile_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_accounts` (`buyer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cart_details` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `cart_status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cart_items` (
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`cart_id`,`product_id`),
  KEY `cart_items_ibfk_2` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `cart_details` (`cart_id`),
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cities` (
  `city_id` int NOT NULL AUTO_INCREMENT,
  `city_name` varchar(100) NOT NULL,
  PRIMARY KEY (`city_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `countries` (
  `country_id` int NOT NULL AUTO_INCREMENT,
  `country_name` varchar(100) NOT NULL,
  PRIMARY KEY (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `order_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `seller_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `sumPrice` int DEFAULT NULL,
  `order_status` varchar(255) DEFAULT 'Pending',
  PRIMARY KEY (`item_id`),
  KEY `order_id` (`order_id`),
  KEY `seller_id` (`seller_id`),
  KEY `order_items_ibfk_2` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`seller_id`) REFERENCES `seller_accounts` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `buyer_id` int NOT NULL,
  `order_date` datetime NOT NULL,
  `total` int DEFAULT NULL,
  `payment_choice` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'COD',
  PRIMARY KEY (`order_id`),
  KEY `buyer_id` (`buyer_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_accounts` (`buyer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `product_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `product_posted_time` (
  `product_id` int NOT NULL,
  `time_posted` datetime DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `product_posted_time_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `product_quantity` (
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `product_quantity_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `product_quantity_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `product_tags` (
  `product_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`product_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `product_tags_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `product_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `category_id` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`product_id`),
  KEY `seller_id` (`seller_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `seller_accounts` (`seller_id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int NOT NULL,
  `buyer_id` int NOT NULL,
  `review_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `rating` int NOT NULL,
  `buyer_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  PRIMARY KEY (`review_id`),
  KEY `seller_id` (`seller_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `fk_reviews_pid` (`product_id`),
  CONSTRAINT `fk_reviews_pid` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `seller_accounts` (`seller_id`),
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_accounts` (`buyer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `seller_accounts` (
  `seller_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint DEFAULT NULL,
  PRIMARY KEY (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `seller_profile` (
  `seller_id` int NOT NULL,
  `companyname` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `companytype` varchar(100) NOT NULL,
  `intro` varchar(500) DEFAULT NULL,
  `image` text,
  `headquarter` varchar(70) DEFAULT NULL,
  PRIMARY KEY (`seller_id`),
  CONSTRAINT `seller_profile_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `seller_accounts` (`seller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `tags` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`tag_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE view view_products AS
SELECT * FROM products 
JOIN product_posted_time USING (product_id)
JOIN product_categories USING (category_id)
JOIN product_quantity USING (product_id);

ALTER TABLE buyer_accounts
DROP COLUMN status;
ALTER TABLE seller_accounts
DROP COLUMN status;

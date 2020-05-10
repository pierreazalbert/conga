#!/usr/bin/env python
# -*- coding: UTF-8 -*-

print "Content-Type: text/plain;charset=utf-8"
print

# enable debugging
import cgi, cgitb

cgitb.enable()

import MySQLdb

def add_inventory():
    
    name = "unknown"
    type = "unknown"
    EAN = "unknown"
    average_lifetime = "0"
    
    #connect to database
    
    db=MySQLdb.connect(host="pierreazywmod1.mysql.db", user="pierreazywmod1", passwd="ee2yearproj", db="pierreazywmod1")
    
    #get info from html form
    
    form = cgi.FieldStorage()
    
    try:
        EAN = form.getvalue('EAN')
        if not EAN :
            exit(1)
        if len(EAN)!=13:
            exit(1)
    except:
        print "Invalid entry"
        exit(1)

    #lookup and match EAN in product database
    
    cursor=db.cursor()

    stmt="SELECT * FROM pierreazywmod1.product_database WHERE (EAN) = '" + str(EAN) + "'"
    
    try:
        cursor.execute(stmt)
        match=cursor.fetchall()
        if not match:
            exit(1)
        for column in match:
            name=column[0]
            type=column[1]
            average_lifetime=column[3]
    except:
        print "Could not recognise product!"
        exit(1)
    
    #if product is recognised, print info, calculate expiry date
    
    print "The product you have scanned is: "
    print "Name: " + str(name)
    print "Type: " + str(type)
    
    stmt="SELECT DATE_ADD(CURDATE(), INTERVAL " + str(average_lifetime) + " DAY);"
    cursor.execute(stmt)
    expiry_date=cursor.fetchall()
    
    print "Expiry date: " + str(expiry_date[0][0])

    stmt="INSERT INTO pierreazywmod1.fridge_content (name, quantity, date_added, expiry_date) VALUES ('" + str(name) + "', '" + str(1) + "', " + "CURDATE()" + ", '" + str(expiry_date[0][0]) + "')"
    cursor.execute(stmt)
    
    print "Product added to fridge inventory!"

    stmt="SELECT * FROM pierreazywmod1.fridge_content"
    cursor.execute(stmt)
    
    file = open("../www/yr2proj/inventory.txt", 'w')
    
    #Write Format: Name Expiry date Quantity Date added
    
    rows=cursor.fetchall()
    
    for row in rows:
        for col in row :
            file.write("%s" % col)
            file.write(":")
        file.write("\n")

    file.close()
    
    cursor.close()
    db.commit()
    db.close()

# run program
if __name__ == "__main__":
    db = add_inventory()
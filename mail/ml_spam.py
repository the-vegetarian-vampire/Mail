import pickle
import pandas as pd
import mailbox
import re
import os
import nltk
from bs4 import BeautifulSoup
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OrdinalEncoder
from sklearn.compose import make_column_transformer
from sklearn.model_selection import train_test_split

nltk.download('punkt')
nltk.download('stopwords')

loaded_model = pickle.load(open('/home/zebra/Work/Mail/mail/knn.pickle', "rb"))

class getEmailFeatures:
    urlRegex = r'https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=;]*)'
    
    def __init__(self, email):
        self.email = email
        self.text, self.html, self.no_of_attachments = self.__extract_email_parts()
        
    def get_sender(self):
        return self.email['From'] 

    def get_subject(self):

        return self.email['Subject']

    def __extract_email_parts(self):
        no_of_attachments = 0
        text = str(self.email['Subject']) + " "
        htmlDoc = ""
        for part in self.email.walk():
            content_type = part.get_content_type()
            if content_type == 'text/plain':
                text += str(part.get_payload())
            elif content_type == 'text/html':
                htmlDoc += part.get_payload()
            else:
                main_content_type = part.get_content_maintype()
                if main_content_type in ['image','application']:
                    no_of_attachments += 1
        return text, htmlDoc, no_of_attachments
    
    def get_urls(self):
        text_urls = set(re.findall(getEmailFeatures.urlRegex,self.text))
        html_urls = set(re.findall(getEmailFeatures.urlRegex,self.html))
        return list(text_urls.union(html_urls))
    
    def get_text(self):
        if(self.html != ""):
            soup = BeautifulSoup(self.html)
            self.text += soup.text
        return self.text
    
    def get_no_of_attachments(self):
        return self.no_of_attachments

class getContentFeatures:
    
    dotRegex = r'\.'
    ipAddressRegex = r'(?:[0-9]{1,3}\.){3}[0-9]{1,3}'
    dashesRegex = r'-'
    specialCharsRegex = r'[()@:%_\+~#?\=;]'
    words = Counter()
    stop_words = set(nltk.corpus.stopwords.words('english'))
    stemmer = nltk.PorterStemmer()
    punctuations = ['!','@','#','$','%','^','&','*','(',')','-','_','=','+',';',':',"'",'"','?','/','<','>','.',',','/','~','`']
    
    def process_title(self, subject):
      if subject is not None:
        subject = str(subject).lower()
        blacklist_words = ['account', 'access', 'bank', 'client', 'confirm','credit', 'debit', 'information', 'log', 'notification', 'password', 'pay', 'recently', 'risk', 'security', 'service', 'user', 'urgent']
        for punctuation in getContentFeatures.punctuations:
          subject = subject.replace(punctuation,' ')
        word_tokens = word_tokenize(subject)

        blacklist_count = 0
        for token in word_tokens:
          if token in blacklist_words:
            blacklist_count += 1
      
        return blacklist_count
      else:
        return 0


    def process_urls(self,urls):
        noOfDots, noOfDashes, noOfSpecialChars, hasIpAddressInUrl, noOfIpAddress, noOfHttpsLinks = 0,0,0,0,0,0
        for url in urls:
            if url.startswith('https://'):
                noOfHttpsLinks += 1
            noOfDots += len(re.findall(getContentFeatures.dotRegex,url))
            noOfDashes += len(re.findall(getContentFeatures.dashesRegex,url))
            noOfSpecialChars += len(re.findall(getContentFeatures.specialCharsRegex,url))
            noOfIpAddress += len(re.findall(getContentFeatures.ipAddressRegex, url))
        if noOfIpAddress > 0:
            hasIpAddressInUrl = 1
        return noOfDots, noOfDashes, noOfSpecialChars, hasIpAddressInUrl, noOfIpAddress, noOfHttpsLinks
    
    def process_text(self, text):
        #lowercase
        text = text.lower()
        
        #remove punctuations
        for punctuation in getContentFeatures.punctuations:
            text = text.replace(punctuation,' ')
        
        #tokenize and stem words
        word_tokens = word_tokenize(text)
        filtered_text = []
        for w in word_tokens:
            if w not in getContentFeatures.stop_words:
                filtered_text.append(w)
        
        #count frequency of words
        word_counts = Counter(filtered_text)
        stemmed_word_count = Counter()
        for word, count in word_counts.items():
            stemmed_word = getContentFeatures.stemmer.stem(word)
            stemmed_word_count[stemmed_word] += count
        word_counts = stemmed_word_count
        getContentFeatures.words += word_counts
    
    def get_most_common_words(self):
        return getContentFeatures.words.most_common(500)
    
def predict(test_data):

  new_df = pd.DataFrame(columns=['sender', 'subject', 'noOfBlacklistWords','noOfDots', 'noOfDashes', 'noOfSpecialChars', 'hasIpAddressInUrl', 'noOfIpAddress', 'noOfHttpsLinks','text','no_of_attachments'])
  stringUtil = getContentFeatures()
  for email in test_data:
      emailUtil = getEmailFeatures(email)
      sender = emailUtil.get_sender()
      subject = emailUtil.get_subject()
      text = emailUtil.get_text()
      urls = emailUtil.get_urls()
      no_of_attachments = emailUtil.get_no_of_attachments()
      urls_features = stringUtil.process_urls(urls)
      no_blcklist_words = stringUtil.process_title(subject)
      stringUtil.process_text(text)

      new_df.loc[len(new_df)] = [sender, subject, no_blcklist_words, urls_features[0],urls_features[1],urls_features[2],urls_features[3],urls_features[4],urls_features[5], text, no_of_attachments]
   
  new_df = new_df.drop(labels = ['sender', 'subject', 'text'], axis = 1)

  predict = loaded_model.predict(new_df)

  if predict[0] == 1:
      return True
  else:
    return False